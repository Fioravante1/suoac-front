import { isCircuitRole, type UserRole } from "@/shared/auth";
import { diffInCalendarDays, formatDate, toDateStringInTimeZone } from "@/shared/lib";

export const EVENT_TYPES = {
  ASSEMBLY: "ASSEMBLY",
  REGIONAL_CONVENTION: "REGIONAL_CONVENTION",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export const EVENT_TYPE_VALUES = [EVENT_TYPES.ASSEMBLY, EVENT_TYPES.REGIONAL_CONVENTION] as const;

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EVENT_TYPES.ASSEMBLY]: "Assembleia",
  [EVENT_TYPES.REGIONAL_CONVENTION]: "Congresso regional",
};

export const EVENT_STATUSES = {
  DRAFT: "DRAFT",
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  FINISHED: "FINISHED",
  CANCELLED: "CANCELLED",
} as const;

export type EventStatus = (typeof EVENT_STATUSES)[keyof typeof EVENT_STATUSES];

export const EVENT_STATUS_VALUES = [
  EVENT_STATUSES.DRAFT,
  EVENT_STATUSES.OPEN,
  EVENT_STATUSES.CLOSED,
  EVENT_STATUSES.FINISHED,
  EVENT_STATUSES.CANCELLED,
] as const;

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  [EVENT_STATUSES.DRAFT]: "Rascunho",
  [EVENT_STATUSES.OPEN]: "Inscrições abertas",
  [EVENT_STATUSES.CLOSED]: "Inscrições encerradas",
  [EVENT_STATUSES.FINISHED]: "Finalizado",
  [EVENT_STATUSES.CANCELLED]: "Cancelado",
};

export type EventStatusVariant = "success" | "critical" | "attention" | "info" | "neutral";

export const EVENT_STATUS_BADGE_VARIANTS: Record<EventStatus, EventStatusVariant> = {
  [EVENT_STATUSES.DRAFT]: "neutral",
  [EVENT_STATUSES.OPEN]: "success",
  [EVENT_STATUSES.CLOSED]: "attention",
  [EVENT_STATUSES.FINISHED]: "info",
  [EVENT_STATUSES.CANCELLED]: "critical",
};

export const EVENT_UPDATE_FIELDS = {
  TITLE: "title",
  TICKET_PRICE: "ticketPrice",
  REGISTRATION_DEADLINE: "registrationDeadline",
  PAYMENT_DEADLINE: "paymentDeadline",
  VENUE: "venue",
  ADDRESS: "address",
  CITY: "city",
  STATE: "state",
  OBSERVATIONS: "observations",
} as const;

export type EventUpdateField = (typeof EVENT_UPDATE_FIELDS)[keyof typeof EVENT_UPDATE_FIELDS];

export const EVENT_EDITABLE_FIELDS_BY_STATUS: Record<EventStatus, readonly EventUpdateField[]> = {
  [EVENT_STATUSES.DRAFT]: Object.values(EVENT_UPDATE_FIELDS),
  [EVENT_STATUSES.OPEN]: [
    EVENT_UPDATE_FIELDS.TITLE,
    EVENT_UPDATE_FIELDS.TICKET_PRICE,
    EVENT_UPDATE_FIELDS.REGISTRATION_DEADLINE,
    EVENT_UPDATE_FIELDS.PAYMENT_DEADLINE,
    EVENT_UPDATE_FIELDS.VENUE,
    EVENT_UPDATE_FIELDS.ADDRESS,
    EVENT_UPDATE_FIELDS.CITY,
    EVENT_UPDATE_FIELDS.STATE,
    EVENT_UPDATE_FIELDS.OBSERVATIONS,
  ],
  [EVENT_STATUSES.CLOSED]: [EVENT_UPDATE_FIELDS.OBSERVATIONS],
  [EVENT_STATUSES.FINISHED]: [],
  [EVENT_STATUSES.CANCELLED]: [],
};

/**
 * Campos que, em determinado status, só podem ser editados por CIRCUIT_COORDINATOR.
 * Para CIRCUIT_ASSISTANT, esses campos devem ficar desabilitados no formulário.
 */
export const EVENT_COORDINATOR_ONLY_FIELDS_BY_STATUS: Partial<Record<EventStatus, readonly EventUpdateField[]>> = {
  [EVENT_STATUSES.OPEN]: [EVENT_UPDATE_FIELDS.REGISTRATION_DEADLINE, EVENT_UPDATE_FIELDS.PAYMENT_DEADLINE],
};

export function canUpdateEventStatus(status: EventStatus): boolean {
  return EVENT_EDITABLE_FIELDS_BY_STATUS[status].length > 0;
}

export function canDeleteEventStatus(status: EventStatus): boolean {
  return status === EVENT_STATUSES.DRAFT;
}

export function isEventFieldEditable(status: EventStatus, field: EventUpdateField): boolean {
  return EVENT_EDITABLE_FIELDS_BY_STATUS[status].includes(field);
}

export function isEventFieldCoordinatorOnly(status: EventStatus, field: EventUpdateField): boolean {
  const restricted = EVENT_COORDINATOR_ONLY_FIELDS_BY_STATUS[status];

  return restricted ? restricted.includes(field) : false;
}

/**
 * Fuso em que as datas do evento valem: o "hoje" da contagem regressiva e da linha de etapas é
 * o de São Paulo, como no back (`EVENT_TIMEZONE`), e não o do navegador de quem olha.
 */
export const EVENT_TIME_ZONE = "America/Sao_Paulo";

/**
 * Data de calendário em São Paulo ("2026-10-12") de um instante do evento: um prazo, a abertura
 * ou o encerramento das inscrições. A API grava "até 12/10" como o último instante do dia 12 lá
 * (`2026-10-13T02:59:59.999Z`), e lido em UTC o prazo cairia no dia 13.
 *
 * Os dias do evento não passam por aqui: são datas puras, gravadas à meia-noite UTC.
 */
export function toEventCalendarDate(instant: string): string {
  return toDateStringInTimeZone(new Date(instant), EVENT_TIME_ZONE);
}

/** Um prazo do evento por extenso, no dia dele em São Paulo: "12/10/2026" para "até 12/10". */
export function formatEventDeadline(deadline: string): string {
  return formatDate(toEventCalendarDate(deadline));
}

/** O "hoje" do evento: a data de calendário em São Paulo, e não a do navegador de quem olha. */
export function getEventToday(now: Date = new Date()): string {
  return toDateStringInTimeZone(now, EVENT_TIME_ZONE);
}

/**
 * Dias de calendário do "hoje" do evento até o dia de um prazo: 0 no próprio dia e negativo depois
 * dele. As duas pontas são lidas em São Paulo, e quem olha de outro fuso vê o mesmo número.
 */
export function daysUntilEventDeadline(deadline: string, today: string = getEventToday()): number {
  return diffInCalendarDays(today, toEventCalendarDate(deadline));
}

/**
 * As inscrições, encerradas, ainda podem reabrir: o prazo não passou e o evento não terminou
 * (tem algum dia hoje ou depois, de qualquer status), como a API confere. Depois do prazo, o
 * ciclo de vida encerraria de novo na hora seguinte; com o evento terminado, não há mais o que
 * inscrever. `today` é o dia de calendário em São Paulo.
 */
export function isWithinReopenWindow(
  event: Pick<Event, "registrationDeadline" | "days">,
  today: string = getEventToday(),
): boolean {
  if (daysUntilEventDeadline(event.registrationDeadline, today) < 0) return false;

  return (event.days ?? []).some((day) => diffInCalendarDays(today, day.date) >= 0);
}

export const EVENT_DAY_STATUSES = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
} as const;

export type EventDayStatus = (typeof EVENT_DAY_STATUSES)[keyof typeof EVENT_DAY_STATUSES];

export const EVENT_DAY_STATUS_LABELS: Record<EventDayStatus, string> = {
  [EVENT_DAY_STATUSES.ACTIVE]: "Ativo",
  [EVENT_DAY_STATUSES.CANCELLED]: "Cancelado",
};

export const EVENT_DAY_STATUS_BADGE_VARIANTS: Record<EventDayStatus, "success" | "critical"> = {
  [EVENT_DAY_STATUSES.ACTIVE]: "success",
  [EVENT_DAY_STATUSES.CANCELLED]: "critical",
};

export function canUpdateEventDayTimes(eventStatus: EventStatus, dayStatus: EventDayStatus): boolean {
  return (
    (eventStatus === EVENT_STATUSES.DRAFT || eventStatus === EVENT_STATUSES.OPEN) &&
    dayStatus === EVENT_DAY_STATUSES.ACTIVE
  );
}

export function canCancelEventDay(eventStatus: EventStatus, dayStatus: EventDayStatus): boolean {
  return eventStatus === EVENT_STATUSES.OPEN && dayStatus === EVENT_DAY_STATUSES.ACTIVE;
}

export function canEnrollPassengers(status: EventStatus): boolean {
  return status === EVENT_STATUSES.OPEN;
}

export function canCancelEventStatus(status: EventStatus): boolean {
  return status === EVENT_STATUSES.OPEN;
}

/** Quem olha um evento: o circuito do usuário e se o papel dele é do circuito. */
export interface EventViewer {
  circuitId: string;
  isCircuitUser: boolean;
}

export function toEventViewer(user: { circuitId: string; role: UserRole }): EventViewer {
  return { circuitId: user.circuitId, isCircuitUser: isCircuitRole(user.role) };
}

/**
 * Quem enxerga um evento: só usuários do mesmo circuito, e rascunho só para os papéis do circuito
 * ("Rascunho · só você vê"). O backend é a autoridade; o frontend repete a regra como defesa em
 * profundidade antes de guardar ou mostrar um evento.
 */
export function isEventVisibleTo(event: Pick<Event, "circuitId" | "status">, viewer: EventViewer): boolean {
  if (event.circuitId !== viewer.circuitId) return false;

  return viewer.isCircuitUser || event.status !== EVENT_STATUSES.DRAFT;
}

export function isLastActiveDayInEvent(days: readonly EventDayInEvent[]): boolean {
  return days.filter((day) => day.status === EVENT_DAY_STATUSES.ACTIVE).length === 1;
}

/** Primeiro e último dia do evento, como datas ISO. */
export interface EventPeriod {
  start: string;
  end: string;
}

/** Os dias que acontecem, sem os cancelados, em ordem de data. */
export function getActiveEventDays(days: readonly EventDayInEvent[]): EventDayInEvent[] {
  return days.filter((day) => day.status === EVENT_DAY_STATUSES.ACTIVE).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Período do evento: do primeiro ao último dia ativo. Sem nenhum dia ativo, como no evento
 * cancelado (o cancelamento cancela os dias), contam todos os dias, para o período não sumir.
 * Sem dias, não há período.
 */
export function getEventPeriod(days: readonly EventDayInEvent[]): EventPeriod | null {
  const activeDays = getActiveEventDays(days);
  const countedDays = activeDays.length > 0 ? activeDays : days;
  const dates = countedDays.map((day) => day.date).sort();
  const start = dates.at(0);
  const end = dates.at(-1);

  if (!start || !end) return null;

  return { start, end };
}

/** Datas ISO em ordem decrescente; quem não tem data vai para o fim. */
function compareStartsDescending(a: string | undefined, b: string | undefined): number {
  if (a === b) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;

  return a < b ? 1 : -1;
}

/**
 * Eventos do mais recente para o mais antigo, pelo início do período. Os que não têm dias vão
 * para o fim, na ordem em que vieram.
 */
export function sortEventsByPeriod<T extends Pick<Event, "days">>(events: readonly T[]): T[] {
  return events
    .map((event) => ({ event, start: getEventPeriod(event.days ?? [])?.start }))
    .sort((a, b) => compareStartsDescending(a.start, b.start))
    .map(({ event }) => event);
}

export interface EventDayInEvent {
  id: string;
  dayNumber: number;
  date: string;
  label: string;
  departureTime: string;
  returnTime: string;
  status: EventDayStatus;
  eventId: string;
}

export interface Event {
  id: string;
  title: string;
  type: EventType;
  ticketPrice: string;
  status: EventStatus;
  /** Último instante do dia do prazo em São Paulo; leia a data com `toEventCalendarDate`. */
  registrationDeadline: string;
  /** Mesma regra de `registrationDeadline`. */
  paymentDeadline: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  observations: string | null;
  /**
   * Quando as inscrições abriram: a publicação do rascunho. `null` em rascunho e em evento
   * publicado antes de a API guardar a data. Opcional porque o front pode chegar a produção antes
   * da API que o expõe.
   */
  publishedAt?: string | null;
  /**
   * Quando as inscrições encerraram: o encerramento manual ou, pelo ciclo de vida, o próprio
   * prazo. `null` enquanto estão abertas e em evento antigo sem registro; opcional como `publishedAt`.
   */
  registrationClosedAt?: string | null;
  circuitId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  days?: EventDayInEvent[];
}
