"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, CalendarDays, ChevronRight, Clock, MapPin, Pencil, Plus, RefreshCw, Send, Trash2 } from "lucide-react";

import { useMutation, useQuery, useQueryClient, queryKeys } from "@/shared/api";
import { USER_ROLES, isCircuitRole, useAuth } from "@/shared/auth";
import { routes } from "@/shared/config";
import { useModal, usePagination } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { Pagination } from "@/shared/ui/pagination";
import { SkeletonTableRows } from "@/shared/ui/skeleton";

import {
  EVENT_STATUS_BADGE_VARIANTS,
  EVENT_STATUS_LABELS,
  EVENT_STATUSES,
  EVENT_TYPE_LABELS,
  canCancelEventStatus,
  canDeleteEventStatus,
  canUpdateEventStatus,
  type Event,
} from "@/entities/event";
import { eventListOptions } from "@/entities/event/api";
import { CreateEventFormModal, type CreateEventFormValues } from "@/features/create-event";
import { createEventAction } from "@/features/create-event/api";
import { cancelEventAction } from "@/features/cancel-event";
import { deleteEventAction } from "@/features/delete-event";
import { publishEventAction } from "@/features/publish-event";
import { UpdateEventFormModal, type UpdateEventFormValues } from "@/features/update-event";
import { updateEventAction } from "@/features/update-event/api";

import styles from "./events-page.module.css";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

interface EventCardProps {
  event: Event;
  canManage: boolean;
  isCoordinator: boolean;
  publishing: boolean;
  cancelling: boolean;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onPublish: (event: Event) => void;
  onCancel: (event: Event) => void;
}

function EventCard({
  event,
  canManage,
  isCoordinator,
  publishing,
  cancelling,
  onEdit,
  onDelete,
  onPublish,
  onCancel,
}: EventCardProps) {
  return (
    <Card className={styles.eventCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <span className={styles.eventType}>{EVENT_TYPE_LABELS[event.type]}</span>
          <h2 className={styles.eventTitle}>
            <Link href={routes.eventDetail(event.id)} className={styles.eventTitleLink}>
              {event.title}
            </Link>
          </h2>
        </div>
        <Badge variant={EVENT_STATUS_BADGE_VARIANTS[event.status]}>{EVENT_STATUS_LABELS[event.status]}</Badge>
      </div>

      <div className={styles.eventMeta}>
        <span className={styles.metaItem}>
          <CalendarDays size={18} aria-hidden="true" />
          Inscrições até {formatDate(event.registrationDeadline)}
        </span>
        <span className={styles.metaItem}>
          <Clock size={18} aria-hidden="true" />
          Pagamento até {formatDate(event.paymentDeadline)}
        </span>
        <span className={styles.metaItem}>
          <MapPin size={18} aria-hidden="true" />
          {event.city}, {event.state}
        </span>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.footerTop}>
          <div className={styles.priceGroup}>
            <span className={styles.ticketPrice}>{formatCurrency(event.ticketPrice)}</span>
            <span className={styles.venue}>{event.venue}</span>
          </div>
          <Link href={routes.eventDetail(event.id)} className={styles.detailLink}>
            Ver detalhes
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </div>
        {canManage && (
          <div className={styles.cardActions}>
            {canUpdateEventStatus(event.status) && (
              <Button variant="ghost" onClick={() => onEdit(event)}>
                <Pencil size={18} aria-hidden="true" />
                Editar
              </Button>
            )}
            {canDeleteEventStatus(event.status) && (
              <Button variant="ghost" onClick={() => onDelete(event)}>
                <Trash2 size={18} aria-hidden="true" />
                Excluir
              </Button>
            )}
            {event.status === EVENT_STATUSES.DRAFT && (
              <Button variant="secondary" onClick={() => onPublish(event)} disabled={publishing}>
                <Send size={18} aria-hidden="true" />
                {publishing ? "Publicando…" : "Publicar evento"}
              </Button>
            )}
            {canCancelEventStatus(event.status) && isCoordinator && (
              <Button variant="destructive" onClick={() => onCancel(event)} disabled={cancelling}>
                <Ban size={18} aria-hidden="true" />
                Cancelar evento
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export function EventsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const circuitId = user?.circuitId ?? "";
  const { page, setPage } = usePagination();
  const createModal = useModal();
  const updateModal = useModal<Event>();
  const publishModal = useModal<Event>();
  const deleteModal = useModal<Event>();
  const cancelEventModal = useModal<Event>();
  const canManageEvents = user ? isCircuitRole(user.role) : false;
  const isCoordinator = user?.role === USER_ROLES.CIRCUIT_COORDINATOR;

  const { data, isError, isLoading, refetch } = useQuery(eventListOptions(circuitId, page));
  const events = data?.data ?? [];
  const [operationError, setOperationError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (values: CreateEventFormValues) => createEventAction(circuitId, values),
    onSuccess: (result) => {
      if (!result.success) return;

      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      createModal.close();
    },
  });

  const publishMutation = useMutation({
    mutationFn: (eventId: string) => publishEventAction(eventId),
    onSuccess: (result) => {
      if (!result.success) {
        setOperationError(result.error);
        return;
      }

      setOperationError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      publishModal.close();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ event, values }: { event: Event; values: UpdateEventFormValues }) =>
      updateEventAction(event.id, event.status, values),
    onSuccess: (result) => {
      if (!result.success) {
        setOperationError(result.error);
        return;
      }

      setOperationError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      updateModal.close();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => deleteEventAction(eventId),
    onSuccess: (result) => {
      if (!result.success) {
        setOperationError(result.error);
        return;
      }

      setOperationError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      deleteModal.close();
    },
  });

  const cancelEventMutation = useMutation({
    mutationFn: (eventId: string) => cancelEventAction(eventId),
    onSuccess: (result) => {
      if (!result.success) {
        setOperationError(result.error);
        return;
      }

      setOperationError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      cancelEventModal.close();
    },
  });

  async function handleCreateEvent(values: CreateEventFormValues) {
    return createMutation.mutateAsync(values);
  }

  async function handleUpdateEvent(event: Event, values: UpdateEventFormValues) {
    return updateMutation.mutateAsync({ event, values });
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

  function handleConfirmCancelEvent() {
    if (!cancelEventModal.item) return;

    setOperationError(null);
    cancelEventMutation.mutate(cancelEventModal.item.id);
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Eventos"
        description="Gerencie assembleias e congressos do circuito."
        action={
          canManageEvents ? (
            <Button onClick={() => createModal.open()}>
              <Plus size={18} aria-hidden="true" />
              Novo evento
            </Button>
          ) : null
        }
      />

      <div className={styles.content}>
        {operationError && (
          <div className={styles.errorBanner} role="alert">
            {operationError}
          </div>
        )}

        {isLoading && <SkeletonTableRows rows={6} />}

        {isError && (
          <ErrorState
            title="Não foi possível carregar os eventos"
            description="Verifique sua conexão e tente novamente."
            action={
              <Button onClick={() => refetch()}>
                <RefreshCw size={18} aria-hidden="true" />
                Tentar novamente
              </Button>
            }
          />
        )}

        {data && events.length === 0 && (
          <EmptyState
            icon={<CalendarDays size={48} strokeWidth={1.5} />}
            title="Nenhum evento cadastrado"
            description="Crie a primeira assembleia ou congresso para começar as inscrições do circuito."
            action={
              canManageEvents ? (
                <Button onClick={() => createModal.open()}>
                  <Plus size={18} aria-hidden="true" />
                  Novo evento
                </Button>
              ) : null
            }
          />
        )}

        {data && events.length > 0 && (
          <>
            <div className={styles.eventList}>
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  canManage={canManageEvents}
                  isCoordinator={isCoordinator}
                  publishing={publishMutation.isPending && publishMutation.variables === event.id}
                  cancelling={cancelEventMutation.isPending && cancelEventMutation.variables === event.id}
                  onEdit={updateModal.open}
                  onDelete={deleteModal.open}
                  onPublish={publishModal.open}
                  onCancel={cancelEventModal.open}
                />
              ))}
            </div>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <CreateEventFormModal open={createModal.isOpen} onClose={createModal.close} onSubmit={handleCreateEvent} />
      <UpdateEventFormModal
        open={updateModal.isOpen}
        onClose={updateModal.close}
        onSubmit={handleUpdateEvent}
        event={updateModal.item}
        userRole={user?.role ?? null}
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
