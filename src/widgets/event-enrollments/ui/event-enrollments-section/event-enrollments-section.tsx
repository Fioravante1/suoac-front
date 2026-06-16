"use client";

import { CalendarCheck, DollarSign, Trash2, UserPlus, Users } from "lucide-react";

import {
  PAYMENT_STATUS_BADGE_VARIANTS,
  PAYMENT_STATUS_LABELS,
  canManageEventPassengers,
  type EventPassenger,
  type PaymentStatus,
} from "@/entities/event-passenger";
import { eventPassengerListOptions } from "@/entities/event-passenger";
import { EVENT_TYPES, type Event } from "@/entities/event";
import { useMutation, useQuery, useQueryClient, queryKeys } from "@/shared/api";
import type { ActionResult } from "@/shared/api";
import { isCircuitRole } from "@/shared/auth";
import type { UserRole } from "@/shared/auth";
import { formatCurrency, useModal, usePagination } from "@/shared/lib";
import { ActionMenu, type ActionMenuItem } from "@/shared/ui/action-menu";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { DataTable, type ColumnDef } from "@/shared/ui/data-table";
import { EmptyState } from "@/shared/ui/empty-state";
import { Pagination } from "@/shared/ui/pagination";
import { SkeletonTableRows } from "@/shared/ui/skeleton";
import { useToast } from "@/shared/ui/toast";

import { EnrollPassengerModal, enrollPassengerAction, type EnrollPassengerPayload } from "@/features/enroll-passenger";
import { UpdateDaysModal, updateEventPassengerDaysAction } from "@/features/update-event-passenger-days";
import { removeEventPassengerAction } from "@/features/remove-event-passenger";
import { PassengerPaymentsModal } from "@/features/register-payment";

import styles from "./event-enrollments-section.module.css";

interface EventEnrollmentsSectionProps {
  event: Event;
  userRole: UserRole;
  userCongregationId: string | null;
}

export function EventEnrollmentsSection({ event, userRole, userCongregationId }: EventEnrollmentsSectionProps) {
  const toast = useToast();
  const { page, setPage } = usePagination();

  const enrollModal = useModal();
  const updateDaysModal = useModal<EventPassenger>();
  const removeModal = useModal<EventPassenger>();
  const paymentsModal = useModal<EventPassenger>();

  const queryClient = useQueryClient();

  const canManage = canManageEventPassengers(event.status);
  const isRegionalConvention = event.type === EVENT_TYPES.REGIONAL_CONVENTION;

  const { data: passengersData, isFetching, isError } = useQuery(eventPassengerListOptions(event.id, page));

  // `isFetching` cobre a carga inicial e o refetch em background disparado pela invalidação após
  // inscrever/remover/editar dias. Com `refetchOnWindowFocus` desligado, todo fetch é intencional,
  // então exibir o skeleton nesses momentos dá feedback sem flashes acidentais.
  const skeletonRows = passengersData?.data.length || 5;

  const paymentModalPassenger = paymentsModal.item
    ? (passengersData?.data.find((passenger) => passenger.id === paymentsModal.item?.id) ?? paymentsModal.item)
    : null;

  function invalidateQueries() {
    queryClient.invalidateQueries({ queryKey: queryKeys.eventPassengers.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(event.id) });
    // O dashboard agrega contagens/valores das inscrições. Como ele costuma estar fora de tela neste
    // momento, marcamos como stale para refazer o fetch ao voltar, em vez de exibir dados defasados.
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  }

  const enrollMutation = useMutation({
    mutationFn: (payload: EnrollPassengerPayload) => enrollPassengerAction(event.id, payload),
    onSuccess: (result) => {
      if (result.success) {
        invalidateQueries();
        toast.success("Passageiro inscrito com sucesso.");
      }
    },
  });

  const updateDaysMutation = useMutation({
    mutationFn: ({ epId, dayIds }: { epId: string; dayIds: string[] }) => updateEventPassengerDaysAction(epId, dayIds),
    onSuccess: (result) => {
      if (result.success) {
        invalidateQueries();
        toast.success("Dias da inscrição atualizados.");
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: (epId: string) => removeEventPassengerAction(epId),
    onSuccess: (result, epId) => {
      if (result.success) {
        invalidateQueries();
        removeModal.close();
        toast.success("Inscrição removida.");
      } else {
        toast.error(result.error, {
          action: { label: "Tentar novamente", onClick: () => removeMutation.mutate(epId) },
        });
      }
    },
  });

  async function handleEnroll(payload: EnrollPassengerPayload): Promise<ActionResult<EventPassenger>> {
    return enrollMutation.mutateAsync(payload);
  }

  async function handleUpdateDays(dayIds: string[]): Promise<ActionResult<EventPassenger>> {
    if (!updateDaysModal.item) return { success: false, error: "Inscrição inválida." };

    return updateDaysMutation.mutateAsync({ epId: updateDaysModal.item.id, dayIds });
  }

  function handleConfirmRemove() {
    if (!removeModal.item) return;

    removeMutation.mutate(removeModal.item.id);
  }

  function buildActionMenuItems(ep: EventPassenger): ActionMenuItem[] {
    const all: (ActionMenuItem | false)[] = [
      {
        id: "payments",
        label: "Pagamentos",
        icon: <DollarSign size={16} aria-hidden="true" />,
        onSelect: () => paymentsModal.open(ep),
      },
      canManage &&
        isRegionalConvention && {
          id: "days",
          label: "Editar dias",
          icon: <CalendarCheck size={16} aria-hidden="true" />,
          onSelect: () => updateDaysModal.open(ep),
        },
      canManage && {
        id: "remove",
        label: "Remover inscrição",
        icon: <Trash2 size={16} aria-hidden="true" />,
        onSelect: () => removeModal.open(ep),
        variant: "danger",
      },
    ];

    return all.filter(Boolean) as ActionMenuItem[];
  }

  const tableColumns: ColumnDef<EventPassenger>[] = [
    { id: "name", header: "Nome", cell: (ep) => ep.passenger.name },
    { id: "rg", header: "RG", cell: (ep) => ep.passenger.rg },
    { id: "phone", header: "Telefone", cell: (ep) => ep.passenger.phone ?? "—" },
    {
      id: "days",
      header: "Dias",
      visible: isRegionalConvention,
      cell: (ep) => (
        <div className={styles.dayBadges}>
          {ep.days.map((day) => (
            <Badge key={day.id} variant="neutral">
              {day.label}
            </Badge>
          ))}
        </div>
      ),
    },
    { id: "total", header: "Total", cell: (ep) => formatCurrency(ep.totalAmount) },
    { id: "paid", header: "Pago", cell: (ep) => formatCurrency(ep.paidAmount) },
    {
      id: "status",
      header: "Status",
      cell: (ep) => (
        <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[ep.paymentStatus as PaymentStatus]}>
          {PAYMENT_STATUS_LABELS[ep.paymentStatus as PaymentStatus]}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      headerClassName: styles.actionsHead,
      cellClassName: styles.actionsCell,
      cell: (ep) => <ActionMenu menuId={`enrollment-actions-${ep.id}`} items={buildActionMenuItems(ep)} />,
    },
  ];

  return (
    <Card id="inscricoes">
      <div className={styles.header}>
        <h2 className={styles.title}>Inscrições</h2>
        {canManage && (
          <Button size="small" onClick={() => enrollModal.open()}>
            <UserPlus size={16} aria-hidden="true" />
            Inscrever passageiro
          </Button>
        )}
      </div>

      {isFetching && <SkeletonTableRows rows={skeletonRows} />}

      {!isFetching && isError && (
        <p className={styles.errorMessage}>Não foi possível carregar as inscrições. Tente novamente.</p>
      )}

      {!isFetching && passengersData?.data.length === 0 && (
        <EmptyState
          icon={<Users size={48} />}
          title="Nenhuma inscrição"
          description={
            canManage
              ? 'Este evento ainda não tem passageiros inscritos. Clique em "Inscrever passageiro" para começar.'
              : "Este evento ainda não tem passageiros inscritos."
          }
        />
      )}

      {!isFetching && passengersData && passengersData.data.length > 0 && (
        <>
          <ul className={styles.mobileList}>
            {passengersData.data.map((ep) => (
              <li key={ep.id} className={styles.mobileRow}>
                <div className={styles.mobileRowInfo}>
                  <span className={styles.mobileRowName}>{ep.passenger.name}</span>

                  <div className={styles.mobileRowStatus}>
                    <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[ep.paymentStatus as PaymentStatus]}>
                      {PAYMENT_STATUS_LABELS[ep.paymentStatus as PaymentStatus]}
                    </Badge>
                    <span className={styles.mobileRowAmount}>
                      {formatCurrency(ep.paidAmount)}{" "}
                      <span className={styles.mobileRowAmountTotal}>de {formatCurrency(ep.totalAmount)}</span>
                    </span>
                  </div>

                  <span className={styles.mobileRowRg}>RG {ep.passenger.rg}</span>

                  {ep.days.length > 0 && (
                    <div className={styles.dayBadges}>
                      {ep.days.map((day) => (
                        <Badge key={day.id} variant="neutral">
                          {day.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <ActionMenu menuId={`enrollment-actions-mobile-${ep.id}`} items={buildActionMenuItems(ep)} />
              </li>
            ))}
          </ul>

          <DataTable
            columns={tableColumns}
            data={passengersData.data}
            getRowKey={(ep) => ep.id}
            wrapperClassName={styles.desktopTable}
          />

          {passengersData.meta.totalPages > 1 && (
            <Pagination page={page} totalPages={passengersData.meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      {userCongregationId && (
        <EnrollPassengerModal
          open={enrollModal.isOpen}
          onClose={enrollModal.close}
          onSubmit={handleEnroll}
          event={event}
          congregationId={userCongregationId}
        />
      )}

      {!userCongregationId && isCircuitRole(userRole) && (
        <EnrollPassengerModal
          open={enrollModal.isOpen}
          onClose={enrollModal.close}
          onSubmit={handleEnroll}
          event={event}
          congregationId=""
        />
      )}

      {updateDaysModal.item && (
        <UpdateDaysModal
          open={updateDaysModal.isOpen}
          onClose={updateDaysModal.close}
          onSubmit={handleUpdateDays}
          eventDays={event.days ?? []}
          selectedDayIds={updateDaysModal.item.days.map((d) => d.eventDayId)}
        />
      )}

      {paymentModalPassenger && (
        <PassengerPaymentsModal
          open={paymentsModal.isOpen}
          onClose={paymentsModal.close}
          eventPassenger={paymentModalPassenger}
          event={event}
          userRole={userRole}
        />
      )}

      <ConfirmDialog
        open={removeModal.isOpen}
        onClose={removeModal.close}
        onConfirm={handleConfirmRemove}
        title="Remover inscrição"
        message={`Tem certeza que deseja remover a inscrição de "${removeModal.item?.passenger.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Remover"
        loadingLabel="Removendo..."
        loading={removeMutation.isPending}
        variant="destructive"
      />
    </Card>
  );
}
