export type EventDayStatus = "ACTIVE" | "CANCELLED";

export interface EventDay {
  id: string;
  dayNumber: number;
  date: string;
  label: string;
  departureTime: string;
  returnTime: string;
  status: EventDayStatus;
  eventId: string;
}
