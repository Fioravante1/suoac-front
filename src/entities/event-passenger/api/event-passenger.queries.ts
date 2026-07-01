"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { PaginatedResponse } from "@/shared/api/http-client";

import type { EventPassenger, EventPassengersFinancialResponse, PaymentStatus } from "../model";

export async function fetchEventPassengers(
  eventId: string,
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<EventPassenger>> {
  const url = `${endpoints.eventPassengers.list(eventId)}?page=${page}&limit=${limit}`;

  return httpClient<PaginatedResponse<EventPassenger>>(url);
}

/**
 * Variante financeira da listagem de passageiros: aceita filtro por `paymentStatus` e o response traz
 * `financialSummary` (totais sem filtro). Tem função/tipo próprios para não colidir com a listagem de
 * inscrições no cache. Ver docs/plans/PLANO_PAGINA_FINANCEIRA.md §4.2/§5.2.
 */
export async function fetchEventPassengersFinancial(
  eventId: string,
  page: number = 1,
  paymentStatus?: PaymentStatus,
  limit: number = 10,
): Promise<EventPassengersFinancialResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (paymentStatus) params.set("paymentStatus", paymentStatus);

  const url = `${endpoints.eventPassengers.list(eventId)}?${params.toString()}`;

  return httpClient<EventPassengersFinancialResponse>(url);
}

export async function fetchEventPassenger(id: string): Promise<EventPassenger> {
  return httpClient<EventPassenger>(endpoints.eventPassengers.detail(id));
}
