"use client";

import Link from "next/link";
import {
  Ban,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react";

import { useMutation, useQuery, useQueryClient, queryKeys } from "@/shared/api";
import { useAuthPermissions, isCircuitRole } from "@/shared/auth";
import { routes } from "@/shared/config";
import { formatCurrency, formatDate, useModal, usePagination } from "@/shared/lib";
import { ActionMenu, type ActionMenuItem } from "@/shared/ui/action-menu";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { Pagination } from "@/shared/ui/pagination";
import { SkeletonCardGrid } from "@/shared/ui/skeleton";
import { useToast } from "@/shared/ui/toast";

import {
  EVENT_STATUS_BADGE_VARIANTS,
  EVENT_STATUS_LABELS,
  EVENT_STATUSES,
  EVENT_TYPE_LABELS,
  canCancelEventStatus,
  canDeleteEventStatus,
  canEnrollPassengers,
  canUpdateEventStatus,
  type Event,
} from "@/entities/event";
import { eventDetailOptions, eventListOptions } from "@/entities/event/api";
import { CreateEventFormModal, type CreateEventFormValues } from "@/features/create-event";
import { createEventAction } from "@/features/create-event/api";
import { cancelEventAction } from "@/features/cancel-event";
import { deleteEventAction } from "@/features/delete-event";
import { publishEventAction } from "@/features/publish-event";
import { UpdateEventFormModal, type UpdateEventFormValues } from "@/features/update-event";
import { updateEventAction } from "@/features/update-event/api";
import { EnrollPassengerModal, enrollPassengerAction, type EnrollPassengerPayload } from "@/features/enroll-passenger";

import styles from "./events-page.module.css";

interface EventCardProps {
  event: Event;
  canManage: boolean;
  isCoordinator: boolean;
  publishing: boolean;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onPublish: (event: Event) => void;
  onCancel: (event: Event) => void;
  onEnroll: (event: Event) => void;
}

function buildEventMenuItems(
  event: Event,
  isCoordinator: boolean,
  onEdit: (event: Event) => void,
  onDelete: (event: Event) => void,
  onCancel: (event: Event) => void,
): ActionMenuItem[] {
  const items: (ActionMenuItem | false)[] = [
    canUpdateEventStatus(event.status) && {
      id: "edit",
      label: "Editar",
      icon: <Pencil size={16} />,
      onSelect: () => onEdit(event),
    },
    canDeleteEventStatus(event.status) && {
      id: "delete",
      label: "Excluir",
      icon: <Trash2 size={16} />,
      variant: "danger" as const,
      onSelect: () => onDelete(event),
    },
    canCancelEventStatus(event.status) &&
      isCoordinator && {
        id: "cancel",
        label: "Cancelar evento",
        icon: <Ban size={16} />,
        variant: "danger" as const,
        onSelect: () => onCancel(event),
      },
  ];

  return items.filter((item): item is ActionMenuItem => Boolean(item));
}

function EventCard({
  event,
  canManage,
  isCoordinator,
  publishing,
  onEdit,
  onDelete,
  onPublish,
  onCancel,
  onEnroll,
}: EventCardProps) {
  const menuItems = canManage ? buildEventMenuItems(event, isCoordinator, onEdit, onDelete, onCancel) : [];

  return (
    <Card className={styles.eventCard}>
      <div className={styles.cardHeader}>
        <span className={styles.eventType}>{EVENT_TYPE_LABELS[event.type]}</span>
        <div className={styles.cardHeaderRight}>
          <Badge variant={EVENT_STATUS_BADGE_VARIANTS[event.status]}>{EVENT_STATUS_LABELS[event.status]}</Badge>
          {menuItems.length > 0 && <ActionMenu menuId={`event-actions-${event.id}`} items={menuItems} />}
        </div>
      </div>

      <h2 className={styles.eventTitle}>
        <Link href={routes.eventDetail(event.id)} className={styles.eventTitleLink}>
          {event.title}
        </Link>
      </h2>

      <div className={styles.eventMeta}>
        <span className={styles.metaItem}>
          <CalendarDays size={16} aria-hidden="true" />
          Inscrições até {formatDate(event.registrationDeadline)}
        </span>
        <span className={styles.metaItem}>
          <Clock size={16} aria-hidden="true" />
          Pagamento até {formatDate(event.paymentDeadline)}
        </span>
        <span className={styles.metaItem}>
          <MapPin size={16} aria-hidden="true" />
          {event.city}, {event.state}
        </span>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.footerRow}>
          <div className={styles.footerInfo}>
            <span className={styles.ticketPrice}>{formatCurrency(event.ticketPrice)}</span>
            <span className={styles.footerSeparator} aria-hidden="true">
              ·
            </span>
            <span className={styles.venue}>{event.venue}</span>
          </div>
          <Link href={routes.eventDetail(event.id)} className={styles.detailLink}>
            Ver detalhes
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {(canManage && event.status === EVENT_STATUSES.DRAFT) || canEnrollPassengers(event.status) ? (
          <div className={styles.cardActions}>
            {canManage && event.status === EVENT_STATUSES.DRAFT && (
              <Button variant="secondary" size="small" onClick={() => onPublish(event)} disabled={publishing}>
                <Send size={16} aria-hidden="true" />
                {publishing ? "Publicando…" : "Publicar evento"}
              </Button>
            )}
            {canEnrollPassengers(event.status) && (
              <Button size="small" onClick={() => onEnroll(event)}>
                <UserPlus size={16} aria-hidden="true" />
                Inscrever passageiro
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function EventsPage() {
  const { userCircuitId, userRole, userCongregationId, isCircuitUser, isCircuitCoordinator } = useAuthPermissions();
  const { page, setPage } = usePagination();

  const queryClient = useQueryClient();
  const createModal = useModal();
  const updateModal = useModal<Event>();
  const publishModal = useModal<Event>();
  const deleteModal = useModal<Event>();
  const cancelEventModal = useModal<Event>();
  const enrollModal = useModal<Event>();

  const toast = useToast();

  const circuitId = userCircuitId;
  const canManageEvents = isCircuitUser;

  const enrollEventId = enrollModal.item?.id ?? "";
  const { data: enrollEventDetail } = useQuery({
    ...eventDetailOptions(enrollEventId),
    enabled: Boolean(enrollEventId),
  });

  const enrollMutation = useMutation({
    mutationFn: (payload: EnrollPassengerPayload) => enrollPassengerAction(enrollEventId, payload),
    onSuccess: (result) => {
      if (!result.success) return;

      queryClient.invalidateQueries({ queryKey: queryKeys.eventPassengers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(enrollEventId) });
      // A inscrição altera contagens/valores agregados no Dashboard e na tela Financeira.
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.financialSummary.all });
      toast.success("Passageiro inscrito com sucesso.");
    },
  });

  async function handleEnroll(payload: EnrollPassengerPayload) {
    return enrollMutation.mutateAsync(payload);
  }

  const enrollCongregationId = userCongregationId ?? "";
  const canShowEnrollModal = enrollEventDetail && (userCongregationId || (userRole && isCircuitRole(userRole)));

  const { data, isError, isLoading, refetch } = useQuery(eventListOptions(circuitId, page));
  const events = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (values: CreateEventFormValues) => createEventAction(circuitId, values),
    onSuccess: (result) => {
      if (!result.success) return;

      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      createModal.close();
      toast.success("Evento criado com sucesso.");
    },
  });

  const publishMutation = useMutation({
    mutationFn: (eventId: string) => publishEventAction(eventId),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      publishModal.close();
      toast.success("Evento publicado.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ event, values }: { event: Event; values: UpdateEventFormValues }) =>
      updateEventAction(event.id, event.status, values),
    onSuccess: (result) => {
      if (!result.success) return;

      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      updateModal.close();
      toast.success("Evento atualizado.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => deleteEventAction(eventId),
    onSuccess: (result, eventId) => {
      if (!result.success) {
        toast.error(result.error, {
          action: { label: "Tentar novamente", onClick: () => deleteMutation.mutate(eventId) },
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      deleteModal.close();
      toast.success("Evento excluído.");
    },
  });

  const cancelEventMutation = useMutation({
    mutationFn: (eventId: string) => cancelEventAction(eventId),
    onSuccess: (result, eventId) => {
      if (!result.success) {
        toast.error(result.error, {
          action: { label: "Tentar novamente", onClick: () => cancelEventMutation.mutate(eventId) },
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      cancelEventModal.close();
      toast.success("Evento cancelado.");
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

    publishMutation.mutate(publishModal.item.id);
  }

  function handleConfirmDelete() {
    if (!deleteModal.item) return;

    deleteMutation.mutate(deleteModal.item.id);
  }

  function handleConfirmCancelEvent() {
    if (!cancelEventModal.item) return;

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
        {isLoading && <SkeletonCardGrid count={4} />}

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
                  isCoordinator={isCircuitCoordinator}
                  publishing={publishMutation.isPending && publishMutation.variables === event.id}
                  onEdit={updateModal.open}
                  onDelete={deleteModal.open}
                  onPublish={publishModal.open}
                  onCancel={cancelEventModal.open}
                  onEnroll={enrollModal.open}
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
        userRole={userRole}
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
      {canShowEnrollModal && (
        <EnrollPassengerModal
          open={enrollModal.isOpen}
          onClose={enrollModal.close}
          onSubmit={handleEnroll}
          event={enrollEventDetail}
          congregationId={enrollCongregationId}
        />
      )}
    </div>
  );
}
