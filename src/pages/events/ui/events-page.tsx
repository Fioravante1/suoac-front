"use client";

import { useState } from "react";
import { CalendarDays, Clock, MapPin, Plus, RefreshCw, Send } from "lucide-react";

import { useMutation, useQuery, useQueryClient, queryKeys } from "@/shared/api";
import { isCircuitRole, useAuth } from "@/shared/auth";
import { useModal, usePagination } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
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
  type Event,
} from "@/entities/event";
import { eventListOptions } from "@/entities/event/api/event.options";
import { createEventAction } from "@/features/create-event/api";
import { CreateEventFormModal, type CreateEventFormValues } from "@/features/create-event";
import { publishEventAction } from "@/features/publish-event";

import styles from "./events-page.module.css";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

interface EventCardProps {
  event: Event;
  canPublish: boolean;
  publishing: boolean;
  onPublish: (event: Event) => void;
}

function EventCard({ event, canPublish, publishing, onPublish }: EventCardProps) {
  return (
    <Card className={styles.eventCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <span className={styles.eventType}>{EVENT_TYPE_LABELS[event.type]}</span>
          <h2 className={styles.eventTitle}>{event.title}</h2>
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
        <div className={styles.priceGroup}>
          <span className={styles.ticketPrice}>{formatCurrency(event.ticketPrice)}</span>
          <span className={styles.venue}>{event.venue}</span>
        </div>
        {canPublish && event.status === EVENT_STATUSES.DRAFT && (
          <Button variant="secondary" onClick={() => onPublish(event)} disabled={publishing}>
            <Send size={18} aria-hidden="true" />
            {publishing ? "Publicando…" : "Publicar evento"}
          </Button>
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
  const canManageEvents = user ? isCircuitRole(user.role) : false;

  const { data, isError, isLoading, refetch } = useQuery(eventListOptions(circuitId, page));
  const events = data?.data ?? [];
  const [publishError, setPublishError] = useState<string | null>(null);

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
        setPublishError(result.error);
        return;
      }

      setPublishError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });

  async function handleCreateEvent(values: CreateEventFormValues) {
    return createMutation.mutateAsync(values);
  }

  function handlePublishEvent(event: Event) {
    setPublishError(null);
    publishMutation.mutate(event.id);
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
        {publishError && (
          <div className={styles.errorBanner} role="alert">
            {publishError}
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
                  canPublish={canManageEvents}
                  publishing={publishMutation.isPending && publishMutation.variables === event.id}
                  onPublish={handlePublishEvent}
                />
              ))}
            </div>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <CreateEventFormModal open={createModal.isOpen} onClose={createModal.close} onSubmit={handleCreateEvent} />
    </div>
  );
}
