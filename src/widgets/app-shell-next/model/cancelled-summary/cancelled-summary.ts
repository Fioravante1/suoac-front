import { toEventCalendarDate, type Event } from "@/entities/event";
import { formatDayMonth } from "@/shared/lib";

/**
 * Apresenta data em São Paulo e autor do cancelamento, com fallback para legados.
 */
export function formatCancellationHeader(event: Pick<Event, "cancelledAt" | "cancelledBy">) {
  const date =
    event.cancelledAt && Number.isFinite(Date.parse(event.cancelledAt))
      ? formatDayMonth(toEventCalendarDate(event.cancelledAt))
      : null;
  const author = event.cancelledBy?.name;
  const effects = "Inscrições e pagamentos estão bloqueados.";
  const desktopTitle = date ? `Cancelado em ${date}` : "Evento cancelado";
  return {
    desktopTitle: author ? `${desktopTitle} por ${author}` : desktopTitle,
    desktopSubtitle: effects,
    compactTitle: date ? `Evento cancelado em ${date}` : "Evento cancelado",
    compactSubtitle: author ? `Por ${author}. ${effects}` : effects,
  };
}
