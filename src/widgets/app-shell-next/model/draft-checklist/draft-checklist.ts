import {
  EVENT_TYPE_LABELS,
  getActiveEventDays,
  getEventPeriod,
  toEventCalendarDate,
  type Event,
} from "@/entities/event";
import { routes } from "@/shared/config";
import { formatCurrencyCompact, formatDayMonthRange, formatDayMonth, pluralize } from "@/shared/lib";

export interface DraftChecklistItem {
  id: string;
  title: string;
  subtitle: string;
  isDone: boolean;
  action: { label: string; kind: "link"; href: string } | { label: string; kind: "coming-soon" };
}

export interface DraftChecklist {
  items: DraftChecklistItem[];
  readyCount: number;
  totalCount: number;
  percent: number;
}

export const ON_PUBLISH_STEPS = [
  "Os coordenadores das congregações serão avisados por e-mail e notificação (em breve).",
  "As inscrições abrem até o prazo definido.",
  "O evento aparece no seletor do topo para todos.",
] as const;

function validDate(value: string): boolean {
  return Boolean(value) && Number.isFinite(Date.parse(value));
}

/**
 * Calcula as pendências de publicação com dados reais do evento e do circuito.
 * Ônibus permanece pendente até a Fatia 7, sem impedir a publicação.
 */
export function buildDraftChecklist(event: Event, activeCongregationCount?: number): DraftChecklist {
  const days = getActiveEventDays(event.days ?? []);
  const edit = { label: "Editar", kind: "link" as const, href: routes.eventDetail(event.id) };
  const [first] = days;
  const dateDescription = describeDraftPeriod(event, days.length > 1);
  const schedule = days.length === 1 && first ? ` · saída ${first.departureTime}, retorno ${first.returnTime}` : "";
  const hasDeadlines = validDate(event.registrationDeadline) && validDate(event.paymentDeadline);
  const priceDescription = hasDeadlines
    ? `${formatCurrencyCompact(event.ticketPrice)} por dia · inscrições até ${formatDayMonth(toEventCalendarDate(event.registrationDeadline))}`
    : "Defina o valor e os prazos";
  const items: DraftChecklistItem[] = [
    {
      id: "identity",
      title: "Nome, tipo e local",
      isDone: [event.title, event.venue, event.city, event.state].every((value) => Boolean(value.trim())),
      subtitle: `${EVENT_TYPE_LABELS[event.type]} · ${event.venue}, ${event.city}`,
      action: edit,
    },
    {
      id: "dates",
      title: days.length > 1 ? "Datas" : "Data",
      isDone: days.length > 0,
      subtitle: `${dateDescription}${schedule}`,
      action: edit,
    },
    {
      id: "pricing",
      title: "Valor e prazos",
      isDone: Number(event.ticketPrice) > 0 && hasDeadlines,
      subtitle: priceDescription,
      action: edit,
    },
    {
      id: "buses",
      title: "Ônibus",
      isDone: false,
      subtitle: "Nenhum ônibus cadastrado",
      action: { label: "Adicionar", kind: "coming-soon" },
    },
    {
      id: "congregations",
      title: "Congregações",
      isDone: (activeCongregationCount ?? 0) > 0,
      subtitle: congregationDescription(activeCongregationCount),
      action: { label: "Revisar", kind: "link", href: routes.congregations },
    },
  ];
  const readyCount = items.filter((item) => item.isDone).length;
  const totalCount = items.length;
  return { items, readyCount, totalCount, percent: Math.round((readyCount / totalCount) * 100) };
}

function congregationDescription(count: number | undefined): string {
  if (count === undefined) return "Todas participam";
  if (count === 0) return "Nenhuma congregação ativa";
  return `${count} ${pluralize(count, "congregação participa", "congregações participam")}`;
}

/** Período do rascunho, sem os horários específicos dos itens do checklist. */
function describeDraftPeriod(event: Pick<Event, "days">, includeYear: boolean): string {
  const period = getEventPeriod(getActiveEventDays(event.days ?? []));
  if (!period) return "Nenhum dia ativo";
  const range = formatDayMonthRange(period.start, period.end);
  return includeYear ? `${range}/${new Date(period.end).getUTCFullYear()}` : range;
}

/** Linha do cabeçalho compacto do Lacunas: período · local, cidade · valor. */
export function getDraftEventDescription(event: Event): string {
  return `${describeDraftPeriod(event, true)} · ${event.venue}, ${event.city} · ${formatCurrencyCompact(event.ticketPrice)} por dia`;
}
