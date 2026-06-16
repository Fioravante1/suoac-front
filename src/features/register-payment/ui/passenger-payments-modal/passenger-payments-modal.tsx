"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, DollarSign, Receipt, Trash2 } from "lucide-react";

import type { Payment } from "@/entities/payment";
import { paymentListOptions } from "@/entities/payment";
import type { EventPassenger, PaymentStatus } from "@/entities/event-passenger";
import { PAYMENT_STATUSES, PAYMENT_STATUS_BADGE_VARIANTS, PAYMENT_STATUS_LABELS } from "@/entities/event-passenger";
import { EVENT_STATUSES, type Event } from "@/entities/event";
import { useMutation, useQuery, useQueryClient, queryKeys } from "@/shared/api";
import { isCircuitRole } from "@/shared/auth";
import type { UserRole } from "@/shared/auth";
import {
  formatCurrency,
  formatDate,
  getTodayDateString,
  subtractCurrency,
  useModal,
  useServerError,
} from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { DataTable, type ColumnDef } from "@/shared/ui/data-table";
import { EmptyState } from "@/shared/ui/empty-state";
import { InfoCard } from "@/shared/ui/info-card";
import { Modal } from "@/shared/ui/modal";
import { Spinner } from "@/shared/ui/spinner";
import { TextField } from "@/shared/ui/text-field";
import { useToast } from "@/shared/ui/toast";

import { registerPaymentAction } from "../../api/register-payment-action";
import { deletePaymentAction } from "../../api/delete-payment-action";
import { registerPaymentSchema, toCreatePaymentPayload, type RegisterPaymentFormValues } from "../../model";

import styles from "./passenger-payments-modal.module.css";

interface PassengerPaymentsModalProps {
  open: boolean;
  onClose: () => void;
  eventPassenger: EventPassenger;
  event: Event;
  userRole: UserRole;
}

function isPaymentDeadlineExpired(event: Event): boolean {
  if (!event.paymentDeadline) return false;

  return new Date() > new Date(event.paymentDeadline);
}

function canShowPaymentForm(
  eventPassenger: EventPassenger,
  event: Event,
  userRole: UserRole,
): { allowed: boolean; reason?: string } {
  if (event.status !== EVENT_STATUSES.OPEN) {
    return { allowed: false, reason: "O evento não está aberto para pagamentos." };
  }

  if (eventPassenger.paymentStatus === PAYMENT_STATUSES.EXEMPT) {
    return { allowed: false };
  }

  const remaining = subtractCurrency(eventPassenger.totalAmount, eventPassenger.paidAmount);

  if (remaining <= 0) {
    return { allowed: false };
  }

  if (isPaymentDeadlineExpired(event) && !isCircuitRole(userRole)) {
    return { allowed: false, reason: "O prazo de pagamento expirou." };
  }

  return { allowed: true };
}

function canDeletePayment(event: Event, userRole: UserRole): { allowed: boolean; reason?: string } {
  if (event.status !== EVENT_STATUSES.OPEN) {
    return { allowed: false, reason: "O evento não está aberto." };
  }

  if (isPaymentDeadlineExpired(event) && !isCircuitRole(userRole)) {
    return { allowed: false, reason: "O prazo de pagamento expirou." };
  }

  return { allowed: true };
}

export function PassengerPaymentsModal({
  open,
  onClose,
  eventPassenger,
  event,
  userRole,
}: PassengerPaymentsModalProps) {
  const { serverError, clearServerError, showServerError } = useServerError();
  const toast = useToast();
  const deleteConfirm = useModal<Payment>();
  const queryClient = useQueryClient();

  const remaining = subtractCurrency(eventPassenger.totalAmount, eventPassenger.paidAmount);
  const formVisibility = canShowPaymentForm(eventPassenger, event, userRole);
  const deleteVisibility = canDeletePayment(event, userRole);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPaymentFormValues>({
    resolver: zodResolver(registerPaymentSchema),
    defaultValues: {
      amount: undefined,
      paidAt: getTodayDateString(),
      observations: "",
    },
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery(paymentListOptions(eventPassenger.id));

  function invalidateQueries() {
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.list(eventPassenger.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.eventPassengers.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(event.id) });
    // Pagamentos alteram os totais financeiros agregados no dashboard. Marcamos como stale para
    // refazer o fetch ao voltar, evitando exibir valores defasados.
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  }

  const deleteMutation = useMutation({
    mutationFn: (paymentId: string) => deletePaymentAction(paymentId),
    onSuccess: (result, paymentId) => {
      if (result.success) {
        invalidateQueries();
        deleteConfirm.close();
        toast.success("Pagamento removido.");
      } else {
        deleteConfirm.close();
        toast.error(result.error, {
          action: { label: "Tentar novamente", onClick: () => deleteMutation.mutate(paymentId) },
        });
      }
    },
  });

  async function handleFormSubmit(values: RegisterPaymentFormValues) {
    clearServerError();
    const payload = toCreatePaymentPayload(values);
    const result = await registerPaymentAction(eventPassenger.id, payload);

    if (!result.success) {
      showServerError(result.error);
      return;
    }

    reset({ amount: undefined, paidAt: getTodayDateString(), observations: "" });
    invalidateQueries();
    toast.success("Pagamento registrado.");
  }

  function handleConfirmDelete() {
    if (!deleteConfirm.item) return;

    clearServerError();
    deleteMutation.mutate(deleteConfirm.item.id);
  }

  function handleClose() {
    clearServerError();
    reset();
    onClose();
  }

  const paymentColumns: ColumnDef<Payment>[] = [
    { id: "amount", header: "Valor", cell: (p) => formatCurrency(p.amount) },
    { id: "date", header: "Data", cell: (p) => formatDate(p.paidAt) },
    { id: "observations", header: "Observações", cell: (p) => p.observations ?? "—" },
    {
      id: "actions",
      header: "Ações",
      visible: deleteVisibility.allowed,
      headerClassName: styles.actionsHead,
      cellClassName: styles.actionsCell,
      cell: (p) => (
        <Button
          variant="ghost"
          size="small"
          onClick={() => deleteConfirm.open(p)}
          aria-label={`Remover pagamento de ${formatCurrency(p.amount)}`}
        >
          <Trash2 size={14} aria-hidden="true" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <Modal open={open} onClose={handleClose} title={`Pagamentos — ${eventPassenger.passenger.name}`}>
        <div className={styles.content}>
          {serverError && (
            <div className={styles.errorBanner} role="alert">
              {serverError}
            </div>
          )}

          <InfoCard
            items={[
              { label: "Total:", value: formatCurrency(eventPassenger.totalAmount) },
              { label: "Pago:", value: formatCurrency(eventPassenger.paidAmount) },
              { label: "Restante:", value: formatCurrency(Math.max(remaining, 0)) },
            ]}
            footer={
              <>
                <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[eventPassenger.paymentStatus as PaymentStatus]}>
                  {PAYMENT_STATUS_LABELS[eventPassenger.paymentStatus as PaymentStatus]}
                </Badge>
                {eventPassenger.paymentStatus === PAYMENT_STATUSES.EXEMPT && eventPassenger.exemptionReason && (
                  <span className={styles.exemptReason}>{eventPassenger.exemptionReason}</span>
                )}
              </>
            }
          />

          {/* Deadline warning */}
          {formVisibility.reason && (
            <div className={styles.deadlineWarning}>
              <AlertTriangle size={16} aria-hidden="true" />
              {formVisibility.reason}
            </div>
          )}

          {/* Payment form */}
          {formVisibility.allowed && (
            <div className={styles.formSection}>
              <span className={styles.sectionTitle}>Registrar pagamento</span>
              <form id="register-payment-form" className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
                <div className={styles.formRow}>
                  <TextField
                    label="Valor (R$)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remaining}
                    placeholder="0,00"
                    error={errors.amount?.message}
                    {...register("amount", { valueAsNumber: true })}
                  />
                  <TextField
                    label="Data do pagamento"
                    type="date"
                    max={getTodayDateString()}
                    error={errors.paidAt?.message}
                    {...register("paidAt")}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="payment-observations">
                    Observações (opcional)
                  </label>
                  <textarea
                    id="payment-observations"
                    className={`${styles.textarea} ${errors.observations ? styles.textareaError : ""}`.trim()}
                    placeholder="Ex: Pagamento via Pix"
                    {...register("observations")}
                  />
                  {errors.observations?.message && (
                    <span className={styles.errorMessage}>{errors.observations.message}</span>
                  )}
                </div>

                <div className={styles.submitRow}>
                  <Button type="submit" size="small" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner size="small" /> : <DollarSign size={16} aria-hidden="true" />}
                    {isSubmitting ? "Registrando..." : "Registrar pagamento"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Payment history */}
          <div className={styles.historySection}>
            <span className={styles.sectionTitle}>Histórico de pagamentos</span>

            {isLoadingPayments && (
              <div className={styles.loadingContainer}>
                <Spinner size="small" />
              </div>
            )}

            {payments && payments.length === 0 && (
              <EmptyState
                icon={<Receipt size={40} />}
                title="Nenhum pagamento"
                description="Ainda não há pagamentos registrados para este passageiro."
              />
            )}

            {payments && payments.length > 0 && (
              <DataTable columns={paymentColumns} data={payments} getRowKey={(p) => p.id} />
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onClose={deleteConfirm.close}
        onConfirm={handleConfirmDelete}
        title="Remover pagamento"
        message={`Tem certeza que deseja remover o pagamento de ${deleteConfirm.item ? formatCurrency(deleteConfirm.item.amount) : ""}? O saldo do passageiro será recalculado.`}
        confirmLabel="Remover"
        loading={deleteMutation.isPending}
        variant="destructive"
      />
    </>
  );
}
