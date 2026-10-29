"use client";

import Link from "next/link";
import { CalendarX, Plus } from "lucide-react";

import { EventStatusDot } from "@/entities/event";
import { ModalNext } from "@/shared/ui/modal-next";
import { Skeleton } from "@/shared/ui/skeleton";

import { useEventSwitcher } from "../../model";

import styles from "./event-switcher-sheet.module.css";

const LOADING_ROWS = [1, 2, 3];

type EventSwitcherSheetProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

/**
 * Seletor de evento do celular e do tablet (`SUOAC Dashboard Mobile.dc.html`): os eventos
 * do circuito numa sheet, que no tablet vira modal central de 540px. Quem desenha o nome
 * do evento no topo e abre a sheet é a navegação do painel (SUC-110).
 */
export function EventSwitcherSheet({ open, onClose }: EventSwitcherSheetProps) {
  const switcher = useEventSwitcher({ isOpen: open });

  const { events, isLoadingEvents, isEventsError, createEventHref } = switcher;
  const hasListContent = !isLoadingEvents && !isEventsError;
  const hasEvents = hasListContent && events.length > 0;
  const hasNoEvents = hasListContent && events.length === 0;

  function handleSelect(eventId: string) {
    onClose();
    switcher.selectEvent(eventId);
  }

  return (
    <ModalNext open={open} onClose={onClose} title="Eventos do circuito">
      {isLoadingEvents && (
        <div className={styles.loading} role="status" aria-label="Carregando eventos" aria-live="polite">
          {LOADING_ROWS.map((row) => (
            <Skeleton key={row} className={styles.loadingRow} />
          ))}
        </div>
      )}

      {isEventsError && (
        <div className={styles.feedback}>
          <p className={styles.feedbackText} role="alert">
            Não foi possível carregar os eventos. Verifique sua conexão e tente de novo.
          </p>
          <button type="button" className={styles.retry} onClick={switcher.retryEvents}>
            Tentar de novo
          </button>
        </div>
      )}

      {hasNoEvents && (
        <div className={styles.empty}>
          <CalendarX className={styles.emptyIcon} size={24} aria-hidden="true" />
          <p className={styles.emptyTitle}>Nenhum evento no circuito ainda.</p>
          <p className={styles.feedbackText}>
            {createEventHref
              ? "Crie o primeiro evento para começar as inscrições."
              : "Quando o circuito criar um evento, ele aparece aqui."}
          </p>
        </div>
      )}

      {hasEvents && (
        <ul className={styles.events}>
          {events.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                className={styles.event}
                aria-current={event.isSelected ? "true" : undefined}
                onClick={() => handleSelect(event.id)}
              >
                <EventStatusDot variant={event.statusVariant} />
                <span className={styles.eventText}>
                  <span className={styles.eventTitle}>{event.title}</span>
                  <span className={styles.eventMeta}>{event.meta}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {createEventHref && (
        <Link href={createEventHref} className={styles.create} onClick={onClose}>
          <Plus size={16} aria-hidden="true" />
          Criar novo evento
        </Link>
      )}
    </ModalNext>
  );
}
