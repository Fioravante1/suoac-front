export interface EventPassengerDay {
  id: string;
  eventDayId: string;
  dayNumber: number;
  date: string;
  label: string;
  checkedIn: boolean;
  checkedInAt: string | null;
}

export interface EventPassengerPassenger {
  id: string;
  name: string;
  rg: string;
  phone: string | null;
}

export interface EventPassenger {
  id: string;
  passenger: EventPassengerPassenger;
  totalAmount: string;
  paidAmount: string;
  paymentStatus: PaymentStatus;
  exemptionReason: string | null;
  observations: string | null;
  eventId: string;
  congregationId: string;
  registeredById: string;
  createdAt: string;
  updatedAt: string;
  days: EventPassengerDay[];
}

export const PAYMENT_STATUSES = {
  PENDING: "PENDING",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
  EXEMPT: "EXEMPT",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUSES.PENDING]: "Pendente",
  [PAYMENT_STATUSES.PARTIAL]: "Parcial",
  [PAYMENT_STATUSES.PAID]: "Pago",
  [PAYMENT_STATUSES.EXEMPT]: "Isento",
};

export const PAYMENT_STATUS_BADGE_VARIANTS: Record<PaymentStatus, "critical" | "attention" | "success" | "info"> = {
  [PAYMENT_STATUSES.PENDING]: "critical",
  [PAYMENT_STATUSES.PARTIAL]: "attention",
  [PAYMENT_STATUSES.PAID]: "success",
  [PAYMENT_STATUSES.EXEMPT]: "info",
};

export function canManageEventPassengers(eventStatus: string): boolean {
  return eventStatus === "OPEN";
}
