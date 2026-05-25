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
  return (
    (eventStatus === EVENT_STATUSES.DRAFT || eventStatus === EVENT_STATUSES.OPEN) &&
    dayStatus === EVENT_DAY_STATUSES.ACTIVE
  );
}

export function canCancelEventStatus(status: EventStatus): boolean {
  return status === EVENT_STATUSES.DRAFT || status === EVENT_STATUSES.OPEN;
}

export function isLastActiveDayInEvent(days: readonly EventDayInEvent[]): boolean {
  return days.filter((day) => day.status === EVENT_DAY_STATUSES.ACTIVE).length === 1;
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
  registrationDeadline: string;
  paymentDeadline: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  observations: string | null;
  circuitId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  days?: EventDayInEvent[];
}
