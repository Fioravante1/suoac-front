"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Pencil,
  RefreshCw,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";

import { useMutation, useQuery, useQueryClient, queryKeys } from "@/shared/api";
import { USER_ROLES, isCircuitRole, useAuth } from "@/shared/auth";
import { routes } from "@/shared/config";
import { useModal } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ErrorState } from "@/shared/ui/error-state";
import { SkeletonTableRows } from "@/shared/ui/skeleton";

import {
  EVENT_DAY_STATUS_BADGE_VARIANTS,
  EVENT_DAY_STATUS_LABELS,
  EVENT_STATUS_BADGE_VARIANTS,
  EVENT_STATUS_LABELS,
  EVENT_STATUSES,
  EVENT_TYPE_LABELS,
  canCancelEventDay,
  canCancelEventStatus,
  canDeleteEventStatus,
  canUpdateEventDayTimes,
  canUpdateEventStatus,
  isLastActiveDayInEvent,
  type Event,
  type EventDayInEvent,
} from "@/entities/event";
import { eventDetailOptions } from "@/entities/event/api";
import { cancelEventAction } from "@/features/cancel-event";
import { cancelEventDayAction } from "@/features/cancel-event-day";
import { deleteEventAction } from "@/features/delete-event";
import { publishEventAction } from "@/features/publish-event";
import { UpdateEventFormModal, type UpdateEventFormValues } from "@/features/update-event";
import { updateEventAction } from "@/features/update-event/api";
import { UpdateEventDayFormModal, type UpdateEventDayFormValues } from "@/features/update-event-day";
import { updateEventDayAction } from "@/features/update-event-day/api";

import styles from "./event-detail-page.module.css";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function formatWeekday(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" }).format(new Date(value));
}

interface EventDetailPageProps {
  eventId: string;
}

export function EventDetailPage({ eventId }: EventDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateModal = useModal<Event>();
  const publishModal = useModal<Event>();
  const deleteModal = useModal<Event>();
  const updateDayModal = useModal<EventDayInEvent>();
  const cancelDayModal = useModal<EventDayInEvent>();
  const cancelEventModal = useModal<Event>();
  const canManage = user ? isCircuitRole(user.role) : false;
  const [operationError, setOperationError] = useState<string | null>(null);

  const { data: event, isError, isLoading, refetch } = useQuery(eventDetailOptions(eventId));

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishEventAction(id),
    onSuccess: (result) => {
      if (!result.success) {
        setOperationError(result.error);
        return;
      }

      setOperationError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      publishModal.close();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ ev, values }: { ev: Event; values: UpdateEventFormValues }) =>
      updateEventAction(ev.id, ev.status, values),
    onSuccess: (result) => {
      if (!result.success) {
        setOperationError(result.error);
        return;
      }

      setOperationError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      updateModal.close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEventAction(id),
    onSuccess: (result) => {
      if (!result.success) {
        setOperationError(result.error);
        return;
      }

      setOperationError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      router.push(routes.events);
    },
  });

  const updateDayMutation = useMutation({
    mutationFn: ({ day, values }: { day: EventDayInEvent; values: UpdateEventDayFormValues }) =>
      updateEventDayAction(day.id, event!.status, day.status, values, {
        departureTime: day.departureTime,
        returnTime: day.returnTime,
      }),
  });

  const cancelDayMutation = useMutation({
    mutationFn: (dayId: string) => cancelEventDayAction(dayId),
    onSuccess: (result) => {
      if (!result.success) {
        setOperationError(result.error);
        return;
      }

      setOperationError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDays.all });
      cancelDayModal.close();
    },
  });

  const cancelEventMutation = useMutation({
    mutationFn: (id: string) => cancelEventAction(id),
    onSuccess: (result) => {
      if (!result.success) {
        setOperationError(result.error);
        return;
      }

      setOperationError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      cancelEventModal.close();
    },
  });

  async function handleUpdateEvent(ev: Event, values: UpdateEventFormValues) {
    return updateMutation.mutateAsync({ ev, values });
  }

  async function handleUpdateDay(day: EventDayInEvent, values: UpdateEventDayFormValues) {
    const result = await updateDayMutation.mutateAsync({ day, values });

    if (result.success) {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDays.all });
    }

    return result;
  }

  function handleConfirmPublish() {
    if (!publishModal.item) return;

    setOperationError(null);
    publishMutation.mutate(publishModal.item.id);
  }

  function handleConfirmDelete() {
    if (!deleteModal.item) return;

    setOperationError(null);
    deleteMutation.mutate(deleteModal.item.id);
  }

  function handleConfirmCancelDay() {
    if (!cancelDayModal.item) return;

    setOperationError(null);
    cancelDayMutation.mutate(cancelDayModal.item.id);
  }

  function handleConfirmCancelEvent() {
    if (!cancelEventModal.item) return;

    setOperationError(null);
    cancelEventMutation.mutate(cancelEventModal.item.id);
  }

  return (
    <div className={styles.page}>
      <Link href={routes.events} className={styles.backLink}>
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar para eventos
      </Link>

      {isLoading && <SkeletonTableRows rows={6} />}

      {isError && (
        <ErrorState
          title="Não foi possível carregar o evento"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button onClick={() => refetch()}>
              <RefreshCw size={18} aria-hidden="true" />
              Tentar novamente
            </Button>
          }
        />
      )}

      {event && (
        <div className={styles.content}>
          {operationError && (
            <div className={styles.errorBanner} role="alert">
              {operationError}
            </div>
          )}

          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.titleGroup}>
                <span className={styles.eventType}>{EVENT_TYPE_LABELS[event.type]}</span>
                <h1 className={styles.title}>{event.title}</h1>
              </div>
              <Badge variant={EVENT_STATUS_BADGE_VARIANTS[event.status]}>{EVENT_STATUS_LABELS[event.status]}</Badge>
            </div>

            {canManage && (
              <div className={styles.actions}>
                {canUpdateEventStatus(event.status) && (
                  <Button variant="ghost" onClick={() => updateModal.open(event)}>
                    <Pencil size={18} aria-hidden="true" />
                    Editar
                  </Button>
                )}
                {canDeleteEventStatus(event.status) && (
                  <Button variant="ghost" onClick={() => deleteModal.open(event)}>
                    <Trash2 size={18} aria-hidden="true" />
                    Excluir
                  </Button>
                )}
                {event.status === EVENT_STATUSES.DRAFT && (
                  <Button
                    variant="secondary"
                    onClick={() => publishModal.open(event)}
                    disabled={publishMutation.isPending}
                  >
                    <Send size={18} aria-hidden="true" />
                    {publishMutation.isPending ? "Publicando..." : "Publicar evento"}
                  </Button>
                )}
                {canCancelEventStatus(event.status) && user?.role === USER_ROLES.CIRCUIT_COORDINATOR && (
                  <Button variant="destructive" onClick={() => cancelEventModal.open(event)}>
                    <Ban size={18} aria-hidden="true" />
                    Cancelar evento
                  </Button>
                )}
              </div>
            )}
          </div>

          <Card>
            <h2 className={styles.cardTitle}>Informações gerais</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <DollarSign size={20} aria-hidden="true" className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Valor da passagem</span>
                  <span className={styles.infoValue}>{formatCurrency(event.ticketPrice)}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <CalendarDays size={20} aria-hidden="true" className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Prazo de inscrição</span>
                  <span className={styles.infoValue}>{formatDate(event.registrationDeadline)}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Clock size={20} aria-hidden="true" className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Prazo de pagamento</span>
                  <span className={styles.infoValue}>{formatDate(event.paymentDeadline)}</span>
                </div>
              </div>
              {event.observations && (
                <div className={styles.infoItem}>
                  <FileText size={20} aria-hidden="true" className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Observações</span>
                    <span className={`${styles.infoValue} ${styles.observations}`}>{event.observations}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className={styles.cardTitle}>Local</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <MapPin size={20} aria-hidden="true" className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Local</span>
                  <span className={styles.infoValue}>{event.venue}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <MapPin size={20} aria-hidden="true" className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Endereço</span>
                  <span className={styles.infoValue}>{event.address}</span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <MapPin size={20} aria-hidden="true" className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Cidade / UF</span>
                  <span className={styles.infoValue}>
                    {event.city} - {event.state}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className={styles.cardTitle}>Dias do evento</h2>
            {event.days && event.days.length > 0 ? (
              <div className={styles.daysList}>
                {event.days.map((day) => (
                  <div key={day.id} className={styles.dayCard}>
                    <div className={styles.dayHeader}>
                      <span className={styles.dayLabel}>{day.label}</span>
                      <Badge variant={EVENT_DAY_STATUS_BADGE_VARIANTS[day.status]}>
                        {EVENT_DAY_STATUS_LABELS[day.status]}
                      </Badge>
                    </div>
                    <div className={styles.dayMeta}>
                      <span className={styles.dayMetaItem}>
                        <CalendarDays size={16} aria-hidden="true" />
                        {formatDate(day.date)} ({formatWeekday(day.date)})
                      </span>
                      <span className={styles.dayMetaItem}>
                        <Clock size={16} aria-hidden="true" />
                        Saída: {day.departureTime}
                      </span>
                      <span className={styles.dayMetaItem}>
                        <Clock size={16} aria-hidden="true" />
                        Retorno: {day.returnTime}
                      </span>
                    </div>
                    {canManage && (
                      <div className={styles.dayActions}>
                        {canUpdateEventDayTimes(event.status, day.status) && (
                          <Button variant="ghost" onClick={() => updateDayModal.open(day)}>
                            <Pencil size={16} aria-hidden="true" />
                            Editar horários
                          </Button>
                        )}
                        {canCancelEventDay(event.status, day.status) &&
                          user?.role === USER_ROLES.CIRCUIT_COORDINATOR && (
                            <Button variant="ghost" onClick={() => cancelDayModal.open(day)}>
                              <XCircle size={16} aria-hidden="true" />
                              Cancelar dia
                            </Button>
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyDays}>Nenhum dia cadastrado para este evento.</p>
            )}
          </Card>
        </div>
      )}

      <UpdateEventFormModal
        open={updateModal.isOpen}
        onClose={updateModal.close}
        onSubmit={handleUpdateEvent}
        event={updateModal.item}
        userRole={user?.role ?? null}
      />
      <UpdateEventDayFormModal
        open={updateDayModal.isOpen}
        onClose={updateDayModal.close}
        onSubmit={handleUpdateDay}
        day={updateDayModal.item}
      />
      <ConfirmDialog
        open={publishModal.isOpen}
        onClose={publishModal.close}
        onConfirm={handleConfirmPublish}
        title="Publicar Evento"
        message={`Tem certeza que deseja publicar o evento "${publishModal.item?.title}"? Depois disso, as congregações poderão visualizar o evento e iniciar as inscrições.`}
        confirmLabel="Publicar"
        loading={publishMutation.isPending}
      />
      <ConfirmDialog
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
        title="Excluir Evento"
        message={`Tem certeza que deseja excluir o evento "${deleteModal.item?.title}"? Essa ação apaga o evento e seus dias e não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        variant="destructive"
      />
      <ConfirmDialog
        open={cancelDayModal.isOpen}
        onClose={cancelDayModal.close}
        onConfirm={handleConfirmCancelDay}
        title="Cancelar Dia"
        message={
          event && event.days && isLastActiveDayInEvent(event.days)
            ? `Tem certeza que deseja cancelar "${cancelDayModal.item?.label}"? Este é o último dia ativo — o evento também será cancelado. Essa ação não pode ser desfeita.`
            : `Tem certeza que deseja cancelar "${cancelDayModal.item?.label}"? Essa ação não pode ser desfeita.`
        }
        confirmLabel="Cancelar dia"
        cancelLabel="Voltar"
        loading={cancelDayMutation.isPending}
        variant="destructive"
      />
      <ConfirmDialog
        open={cancelEventModal.isOpen}
        onClose={cancelEventModal.close}
        onConfirm={handleConfirmCancelEvent}
        title="Cancelar Evento"
        message={`Tem certeza que deseja cancelar o evento "${cancelEventModal.item?.title}"? Todos os dias serão cancelados e as inscrições encerradas. Essa ação não pode ser desfeita.`}
        confirmLabel="Cancelar evento"
        cancelLabel="Voltar"
        loading={cancelEventMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
