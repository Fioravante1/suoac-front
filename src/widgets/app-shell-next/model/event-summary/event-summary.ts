import {
  EVENT_STATUSES,
  EVENT_TYPE_LABELS,
  getActiveEventDays,
  getEventPeriod,
  type Event,
  type EventDayInEvent,
  type EventPeriod,
  type EventStatus,
} from "@/entities/event";
import {
  diffInCalendarDays,
  formatCurrencyCompact,
  formatMonthName,
  formatWeekdayShort,
  pluralize,
} from "@/shared/lib";

/** Um dia do evento no bloco de datas do resumo: "Sex" sobre "23". */
export interface EventDayTile {
  id: string;
  weekday: string;
  day: string;
}

export interface EventSummary {
  dayTiles: readonly EventDayTile[];
  /** "Faltam 16 dias"; `null` no primeiro dia do evento e depois dele. */
  countdown: string | null;
  /** O mês do evento, como "outubro de 2026", sob a contagem no desktop. */
  months: string | null;
  /** "Congresso regional · 3 dias". */
  typeLabel: string;
  /** "Salão de Assembleias · Campinas, SP" no desktop. */
  location: string;
  /** "Salão de Assembleias · Campinas" no celular, que não tem espaço para a UF. */
  compactLocation: string;
  /** "Saída 06:30 · retorno 18:30", ou o aviso de que os horários mudam de um dia para outro. */
  schedule: string | null;
  /** "R$ 40 por dia". */
  price: string;
}

export const SCHEDULE_VARIES_LABEL = "Horários variam por dia";

const STATUSES_WITH_TIMELINE: readonly EventStatus[] = [
  EVENT_STATUSES.OPEN,
  EVENT_STATUSES.CLOSED,
  EVENT_STATUSES.FINISHED,
];

/**
 * O evento publicado tem resumo com linha de etapas e abas. Rascunho e cancelado têm outro
 * resumo, sem etapas nem abas (SUC-111).
 */
export function hasEventTimeline(status: EventStatus): boolean {
  return STATUSES_WITH_TIMELINE.includes(status);
}

function describeCountdown(period: EventPeriod | null, today: string): string | null {
  if (!period) return null;

  const daysLeft = diffInCalendarDays(today, period.start);

  if (daysLeft <= 0) return null;
  if (daysLeft === 1) return "Falta 1 dia";

  return `Faltam ${daysLeft} dias`;
}

/** "outubro de 2026", "outubro e novembro de 2026" ou "dezembro de 2026 e janeiro de 2027". */
function describeMonths(period: EventPeriod | null): string | null {
  if (!period) return null;

  const firstMonth = formatMonthName(period.start);
  const lastMonth = formatMonthName(period.end);
  const firstYear = new Date(period.start).getUTCFullYear();
  const lastYear = new Date(period.end).getUTCFullYear();

  if (firstYear !== lastYear) return `${firstMonth} de ${firstYear} e ${lastMonth} de ${lastYear}`;
  if (firstMonth !== lastMonth) return `${firstMonth} e ${lastMonth} de ${lastYear}`;

  return `${firstMonth} de ${firstYear}`;
}

/**
 * Saída e retorno do evento. O `v3` mostra um horário só, mas a API guarda o de cada dia: quando
 * os dias ativos não batem, o resumo avisa em vez de mostrar um horário que não vale para todos.
 */
function describeSchedule(activeDays: readonly EventDayInEvent[]): string | null {
  const [first] = activeDays;

  if (!first) return null;

  const isSameForAllDays = activeDays.every(
    (day) => day.departureTime === first.departureTime && day.returnTime === first.returnTime,
  );

  if (!isSameForAllDays) return SCHEDULE_VARIES_LABEL;

  return `Saída ${first.departureTime} · retorno ${first.returnTime}`;
}

/**
 * O que o resumo do evento mostra além do título e da linha de etapas: os dias, a contagem
 * regressiva, o tipo, o local, os horários e o valor. `today` é a data de calendário em São
 * Paulo (`getEventToday`).
 */
export function getEventSummary(
  event: Pick<Event, "type" | "days" | "venue" | "city" | "state" | "ticketPrice">,
  today: string,
): EventSummary {
  const days = event.days ?? [];
  const activeDays = getActiveEventDays(days);
  const period = getEventPeriod(days);
  const countedDays = activeDays.length > 0 ? activeDays : days;
  const dayCount = countedDays.length;

  return {
    dayTiles: activeDays.map((day) => ({
      id: day.id,
      weekday: formatWeekdayShort(day.date),
      day: String(new Date(day.date).getUTCDate()),
    })),
    countdown: describeCountdown(period, today),
    months: describeMonths(period),
    typeLabel: `${EVENT_TYPE_LABELS[event.type]} · ${dayCount} ${pluralize(dayCount, "dia")}`,
    location: `${event.venue} · ${event.city}, ${event.state}`,
    compactLocation: `${event.venue} · ${event.city}`,
    schedule: describeSchedule(countedDays),
    price: `${formatCurrencyCompact(event.ticketPrice)} por dia`,
  };
}
