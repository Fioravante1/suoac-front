export type EventType = "ASSEMBLY" | "REGIONAL_CONVENTION";

export type EventStatus = "DRAFT" | "OPEN" | "CLOSED" | "FINISHED";

export type EventDayStatus = "ACTIVE" | "CANCELLED";

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
