"use client";

import { CalendarDays, Clock, MapPin, Plus, RefreshCw } from "lucide-react";

import { useMutation, useQuery, useQueryClient, queryKeys } from "@/shared/api";
import { useAuth } from "@/shared/auth";
import { useModal, usePagination } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { PageHeader } from "@/shared/ui/page-header";
import { Pagination } from "@/shared/ui/pagination";
import { SkeletonTableRows } from "@/shared/ui/skeleton";

import type { Event, EventStatus, EventType } from "@/entities/event";
import { eventListOptions } from "@/entities/event/api/event.options";
import { createEventAction } from "@/features/create-event/api";
import { CreateEventFormModal, type CreateEventFormValues } from "@/features/create-event";

import styles from "./events-page.module.css";

const eventTypeLabels: Record<EventType, string> = {
  ASSEMBLY: "Assembleia",
  REGIONAL_CONVENTION: "Congresso regional",
};

const eventStatusLabels: Record<EventStatus, string> = {
  DRAFT: "Rascunho",
  OPEN: "Inscrições abertas",
  CLOSED: "Inscrições encerradas",
  FINISHED: "Finalizado",
};

const eventStatusVariants: Record<EventStatus, "success" | "critical" | "attention" | "info" | "neutral"> = {
  DRAFT: "neutral",
  OPEN: "success",
  CLOSED: "attention",
  FINISHED: "info",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function EventCard({ event }: { event: Event }) {
  return (
    <Card className={styles.eventCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <span className={styles.eventType}>{eventTypeLabels[event.type]}</span>
          <h2 className={styles.eventTitle}>{event.title}</h2>
        </div>
        <Badge variant={eventStatusVariants[event.status]}>{eventStatusLabels[event.status]}</Badge>
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
        <span className={styles.ticketPrice}>{formatCurrency(event.ticketPrice)}</span>
        <span className={styles.venue}>{event.venue}</span>
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

  const { data, isError, isLoading, refetch } = useQuery(eventListOptions(circuitId, page));

  const createMutation = useMutation({
    mutationFn: (values: CreateEventFormValues) => createEventAction(circuitId, values),
    onSuccess: (result) => {
      if (!result.success) return;

      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      createModal.close();
    },
  });

  async function handleCreateEvent(values: CreateEventFormValues) {
    return createMutation.mutateAsync(values);
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Eventos"
        description="Gerencie assembleias e congressos do circuito."
        action={
          <Button onClick={() => createModal.open()}>
            <Plus size={18} aria-hidden="true" />
            Novo evento
          </Button>
        }
      />

      <div className={styles.content}>
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

        {data && data.data.length === 0 && (
          <EmptyState
            icon={<CalendarDays size={48} strokeWidth={1.5} />}
            title="Nenhum evento cadastrado"
            description="Crie a primeira assembleia ou congresso para começar as inscrições do circuito."
            action={
              <Button onClick={() => createModal.open()}>
                <Plus size={18} aria-hidden="true" />
                Novo evento
              </Button>
            }
          />
        )}

        {data && data.data.length > 0 && (
          <>
            <div className={styles.eventList}>
              {data.data.map((event) => (
                <EventCard key={event.id} event={event} />
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
