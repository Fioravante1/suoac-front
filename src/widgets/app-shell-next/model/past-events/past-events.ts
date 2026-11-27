import {
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  getEventPeriod,
  sortEventsByPeriod,
  type Event,
} from "@/entities/event";
import { formatMonthName, pluralize } from "@/shared/lib";

/**
 * Seleciona o histórico finalizado ou cancelado, do mais recente para o mais antigo.
 */
export function selectPastEvents(events: readonly Event[], limit = 3) {
  return sortEventsByPeriod(
    events.filter((event) => event.status === EVENT_STATUSES.FINISHED || event.status === EVENT_STATUSES.CANCELLED),
  )
    .slice(0, Math.max(0, limit))
    .map((event) => {
      const date = getEventPeriod(event.days ?? [])?.start ?? event.createdAt;
      const count = event.days?.length ?? 0;
      return {
        event,
        monthShort: formatMonthName(date).slice(0, 3),
        yearShort: String(new Date(date).getUTCFullYear()).slice(-2),
        subtitle: `${EVENT_TYPE_LABELS[event.type]} · ${count} ${pluralize(count, "dia")} · ${EVENT_STATUS_LABELS[event.status]}`,
      };
    });
}
