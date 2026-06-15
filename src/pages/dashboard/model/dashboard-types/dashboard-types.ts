import type { EventDayStatus, EventType, EventStatus } from "@/entities/event";
import type { PaymentStatus } from "@/entities/event-passenger";

export interface DashboardPendingPassenger {
  id: string;
  passengerName: string;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  paymentStatus: PaymentStatus;
}

export interface DashboardPaymentBreakdown {
  paid: number;
  partial: number;
  pending: number;
  exempt: number;
}

export interface DashboardStats {
  totalPassengers: number;
  totalExpected: string;
  totalReceived: string;
  totalPending: string;
}

export interface DashboardCongregation {
  id: string;
  name: string;
  listStatus: string;
}

export interface DashboardEventDay {
  id: string;
  date: string;
  label: string;
  dayNumber: number;
  status: EventDayStatus;
}

export interface DashboardEvent {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  ticketPrice: string;
  registrationDeadline: string;
  paymentDeadline: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  days: DashboardEventDay[];
}

export interface DashboardDayCount {
  eventDayId: string;
  dayNumber: number;
  label: string;
  date: string;
  totalPassengers: number;
}

export interface DashboardCongregationSummary {
  id: string;
  name: string;
  totalPassengers: number;
  totalExpected: string;
  totalReceived: string;
  paymentStatus: "paid" | "partial" | "pending";
}

export interface DashboardData {
  event: DashboardEvent;
  congregation: DashboardCongregation | null;
  stats: DashboardStats;
  paymentBreakdown: DashboardPaymentBreakdown;
  pendingPassengers: DashboardPendingPassenger[];
  totalPendingPassengers: number;
  passengersByDay: DashboardDayCount[];
  congregationSummaries?: DashboardCongregationSummary[];
}
