import type { PaginatedResponse } from "@/shared/api";

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

// --- Domínio financeiro (resumo do evento) ---------------------------------------------------------
// `event-passenger` é o dono de `PaymentStatus`/`totalAmount`/`paidAmount`, então o resumo financeiro
// — que agrega esses valores — vive aqui também (evita cross-import entre entidades). Ver
// docs/plans/PLANO_PAGINA_FINANCEIRA.md §3.2.

/** Contagem de inscrições por status de pagamento. Chaves em lowercase como vêm do backend. */
export interface PaymentStatusCounts {
  paid: number;
  partial: number;
  pending: number;
  exempt: number;
}

/**
 * Mapa tipado `PaymentStatus` (uppercase) → chave de contagem em `PaymentStatusCounts` (lowercase).
 * Garante exaustividade em compilação e elimina literais soltos no filtro/contadores da UI.
 */
export const PAYMENT_STATUS_COUNT_KEYS: Record<PaymentStatus, keyof PaymentStatusCounts> = {
  [PAYMENT_STATUSES.PENDING]: "pending",
  [PAYMENT_STATUSES.PARTIAL]: "partial",
  [PAYMENT_STATUSES.PAID]: "paid",
  [PAYMENT_STATUSES.EXEMPT]: "exempt",
};

/**
 * Totais financeiros de um escopo (evento inteiro ou uma congregação). Valores monetários vêm como
 * string (Decimal) e **excluem isentos**; `totalPassengers` e `byStatus.exempt` contam os isentos.
 */
export interface FinancialTotals {
  totalPassengers: number;
  totalExpected: string;
  totalReceived: string;
  totalPending: string;
  byStatus: PaymentStatusCounts;
}

/** Resumo financeiro de uma congregação dentro do evento. */
export interface CongregationFinancial extends FinancialTotals {
  congregationId: string;
  congregationName: string;
}

/** Resposta do endpoint de resumo financeiro do evento (`GET /events/:id/financial-summary`). */
export interface FinancialSummary {
  eventId: string;
  eventTitle: string;
  ticketPrice: string;
  totals: FinancialTotals;
  congregations: CongregationFinancial[];
}

/**
 * Resposta paginada da listagem financeira de passageiros. Estende `PaginatedResponse` com
 * `financialSummary` (totais SEM filtro de status — panorama geral, independente do `paymentStatus`).
 */
export interface EventPassengersFinancialResponse extends PaginatedResponse<EventPassenger> {
  financialSummary: FinancialTotals;
}
