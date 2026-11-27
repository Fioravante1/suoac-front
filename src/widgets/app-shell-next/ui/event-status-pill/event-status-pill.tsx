import { EVENT_STATUSES, EVENT_STATUS_LABELS, type EventStatus } from "@/entities/event";

import styles from "./event-status-pill.module.css";

type EventStatusPillProps = Readonly<{ status: EventStatus; label?: string }>;

type PillTone = "open" | "closed" | "finished" | "draft" | "cancelled" | "neutral";

const PILL_TONES: Partial<Record<EventStatus, PillTone>> = {
  [EVENT_STATUSES.DRAFT]: "draft",
  [EVENT_STATUSES.CANCELLED]: "cancelled",
  [EVENT_STATUSES.OPEN]: "open",
  [EVENT_STATUSES.CLOSED]: "closed",
  [EVENT_STATUSES.FINISHED]: "finished",
};

/**
 * Pílula de status do resumo do evento, sobre o navy (`SUOAC Dashboard v3.dc.html`): verde e
 * pulsando com as inscrições abertas, âmbar quando encerram e neutra com o ponto azul no
 * evento finalizado. O status vem escrito; a cor só reforça.
 */
export function EventStatusPill({ status, label }: EventStatusPillProps) {
  return (
    <span className={styles.pill} data-tone={PILL_TONES[status] ?? "neutral"}>
      <span className={styles.dot} aria-hidden="true" />
      {label ?? EVENT_STATUS_LABELS[status]}
    </span>
  );
}
