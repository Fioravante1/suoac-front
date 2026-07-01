"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { PaginatedResponse } from "@/shared/api/http-client";

import { EVENT_STATUSES } from "../../model";
import type { Event } from "../../model";

/** Busca o evento ativo (status OPEN) do circuito. Retorna `null` quando não há nenhum. */
export async function fetchActiveEvent(circuitId: string): Promise<Event | null> {
  const url = `${endpoints.events.list(circuitId)}?status=${EVENT_STATUSES.OPEN}&limit=1`;
  const response = await httpClient<PaginatedResponse<Event>>(url);

  return response.data[0] ?? null;
}
