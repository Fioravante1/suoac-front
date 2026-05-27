"use client";

import { CalendarCheck, Trash2, UserPlus, Users } from "lucide-react";

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
import { formatCurrency, useModal, usePagination, useServerError } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { Pagination } from "@/shared/ui/pagination";
import { SkeletonTableRows } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrapper } from "@/shared/ui/table";

import { EnrollPassengerModal, enrollPassengerAction, type EnrollPassengerPayload } from "@/features/enroll-passenger";
import { UpdateDaysModal, updateEventPassengerDaysAction } from "@/features/update-event-passenger-days";
import { removeEventPassengerAction } from "@/features/remove-event-passenger";

import styles from "./event-enrollments-section.module.css";

interface EventEnrollmentsSectionProps {
  event: Event;
  userRole: UserRole;
  userCongregationId: string | null;
}

export function EventEnrollmentsSection({ event, userRole, userCongregationId }: EventEnrollmentsSectionProps) {
  const { serverError, clearServerError, showServerError } = useServerError();
  const { page, setPage } = usePagination();

  const enrollModal = useModal();
  const updateDaysModal = useModal<EventPassenger>();
  const removeModal = useModal<EventPassenger>();

  const queryClient = useQueryClient();

  const canManage = canManageEventPassengers(event.status);
  const isRegionalConvention = event.type === EVENT_TYPES.REGIONAL_CONVENTION;

  const { data: passengersData, isLoading, isError } = useQuery(eventPassengerListOptions(event.id, page));

  function invalidateQueries() {
    queryClient.invalidateQueries({ queryKey: queryKeys.eventPassengers.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(event.id) });
  }

  const enrollMutation = useMutation({
    mutationFn: (payload: EnrollPassengerPayload) => enrollPassengerAction(event.id, payload),
    onSuccess: (result) => {
      if (result.success) {
        clearServerError();
        invalidateQueries();
      }
    },
  });

  const updateDaysMutation = useMutation({
    mutationFn: ({ epId, dayIds }: { epId: string; dayIds: string[] }) => updateEventPassengerDaysAction(epId, dayIds),
    onSuccess: (result) => {
      if (result.success) {
        clearServerError();
        invalidateQueries();
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: (epId: string) => removeEventPassengerAction(epId),
    onSuccess: (result) => {
      if (result.success) {
        clearServerError();
        invalidateQueries();
        removeModal.close();
      }

      if (!result.success) {
        showServerError(result.error);
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

    clearServerError();
    removeMutation.mutate(removeModal.item.id);
  }

  return (
    <Card>
      <div className={styles.header}>
        <h2 className={styles.title}>Inscrições</h2>
        {canManage && (
          <Button size="small" onClick={() => enrollModal.open()}>
            <UserPlus size={16} aria-hidden="true" />
            Inscrever passageiro
          </Button>
        )}
      </div>

      {serverError && (
        <div className={styles.errorBanner} role="alert">
          {serverError}
        </div>
      )}

      {isLoading && <SkeletonTableRows rows={5} />}

      {isError && <p className={styles.errorMessage}>Não foi possível carregar as inscrições. Tente novamente.</p>}

      {passengersData && passengersData.data.length === 0 && (
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

      {passengersData && passengersData.data.length > 0 && (
        <>
          <div className={styles.mobileCards}>
            {passengersData.data.map((ep) => (
              <div key={ep.id} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <strong className={styles.mobileCardName}>{ep.passenger.name}</strong>
                  <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[ep.paymentStatus as PaymentStatus]}>
                    {PAYMENT_STATUS_LABELS[ep.paymentStatus as PaymentStatus]}
                  </Badge>
                </div>
                <div className={styles.mobileCardMeta}>
                  <span>RG: {ep.passenger.rg}</span>
                  {ep.passenger.phone && <span>Tel: {ep.passenger.phone}</span>}
                </div>
                {ep.days.length > 0 && (
                  <div className={styles.dayBadges}>
                    {ep.days.map((day) => (
                      <Badge key={day.id} variant="neutral">
                        {day.label}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className={styles.mobileCardFinancial}>
                  <span>Total: {formatCurrency(ep.totalAmount)}</span>
                  <span>Pago: {formatCurrency(ep.paidAmount)}</span>
                </div>
                {canManage && (
                  <div className={styles.mobileCardActions}>
                    {isRegionalConvention && (
                      <Button variant="ghost" size="small" onClick={() => updateDaysModal.open(ep)}>
                        <CalendarCheck size={16} aria-hidden="true" />
                        Editar dias
                      </Button>
                    )}
                    <Button variant="ghost" size="small" onClick={() => removeModal.open(ep)}>
                      <Trash2 size={16} aria-hidden="true" />
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <TableWrapper className={styles.desktopTable}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>RG</TableHead>
                  <TableHead>Telefone</TableHead>
                  {isRegionalConvention && <TableHead>Dias</TableHead>}
                  <TableHead>Total</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {passengersData.data.map((ep) => (
                  <TableRow key={ep.id}>
                    <TableCell>{ep.passenger.name}</TableCell>
                    <TableCell>{ep.passenger.rg}</TableCell>
                    <TableCell>{ep.passenger.phone ?? "—"}</TableCell>
                    {isRegionalConvention && (
                      <TableCell>
                        <div className={styles.dayBadges}>
                          {ep.days.map((day) => (
                            <Badge key={day.id} variant="neutral">
                              {day.label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>{formatCurrency(ep.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(ep.paidAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[ep.paymentStatus as PaymentStatus]}>
                        {PAYMENT_STATUS_LABELS[ep.paymentStatus as PaymentStatus]}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className={styles.actions}>
                          {isRegionalConvention && (
                            <Button variant="ghost" size="small" onClick={() => updateDaysModal.open(ep)}>
                              <CalendarCheck size={16} aria-hidden="true" />
                              Dias
                            </Button>
                          )}
                          <Button variant="ghost" size="small" onClick={() => removeModal.open(ep)}>
                            <Trash2 size={16} aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>

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

      <ConfirmDialog
        open={removeModal.isOpen}
        onClose={removeModal.close}
        onConfirm={handleConfirmRemove}
        title="Remover inscrição"
        message={`Tem certeza que deseja remover a inscrição de "${removeModal.item?.passenger.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Remover"
        loading={removeMutation.isPending}
        variant="destructive"
      />
    </Card>
  );
}
