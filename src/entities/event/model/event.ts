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
} as const;

export type EventStatus = (typeof EVENT_STATUSES)[keyof typeof EVENT_STATUSES];

export const EVENT_STATUS_VALUES = [
  EVENT_STATUSES.DRAFT,
  EVENT_STATUSES.OPEN,
  EVENT_STATUSES.CLOSED,
  EVENT_STATUSES.FINISHED,
] as const;

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  [EVENT_STATUSES.DRAFT]: "Rascunho",
  [EVENT_STATUSES.OPEN]: "Inscrições abertas",
  [EVENT_STATUSES.CLOSED]: "Inscrições encerradas",
  [EVENT_STATUSES.FINISHED]: "Finalizado",
};

export type EventStatusVariant = "success" | "critical" | "attention" | "info" | "neutral";

export const EVENT_STATUS_BADGE_VARIANTS: Record<EventStatus, EventStatusVariant> = {
  [EVENT_STATUSES.DRAFT]: "neutral",
  [EVENT_STATUSES.OPEN]: "success",
  [EVENT_STATUSES.CLOSED]: "attention",
  [EVENT_STATUSES.FINISHED]: "info",
};

export const EVENT_DAY_STATUSES = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
} as const;

export type EventDayStatus = (typeof EVENT_DAY_STATUSES)[keyof typeof EVENT_DAY_STATUSES];

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
