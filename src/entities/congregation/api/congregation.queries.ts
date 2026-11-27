"use server";

import { httpClient, endpoints } from "@/shared/api/http-client";

import type { PaginatedResponse } from "@/shared/api/http-client";

import type { Congregation, CongregationEventStatus } from "../model/congregation";

export async function fetchCongregations(
  circuitId: string,
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<Congregation>> {
  const url = `${endpoints.congregations.list(circuitId)}?page=${page}&limit=${limit}`;

  return httpClient<PaginatedResponse<Congregation>>(url);
}

export async function fetchCongregation(id: string): Promise<Congregation> {
  return httpClient<Congregation>(endpoints.congregations.detail(id));
}

/** A situação da lista de cada congregação do circuito no evento. Só os papéis do circuito leem. */
export async function fetchCongregationEventStatuses(eventId: string): Promise<CongregationEventStatus[]> {
  return httpClient<CongregationEventStatus[]>(endpoints.events.congregationStatuses(eventId));
}

/** A situação individual da lista; a API restringe o escopo de congregação. */
export async function fetchCongregationEventStatus(
  eventId: string,
  congregationId: string,
): Promise<CongregationEventStatus> {
  return httpClient<CongregationEventStatus>(endpoints.events.congregationStatus(eventId, congregationId));
}
