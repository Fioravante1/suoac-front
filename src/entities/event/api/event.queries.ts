"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { PaginatedResponse } from "@/shared/api/http-client";

import type { Event } from "../model";

export async function fetchEvents(
  circuitId: string,
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<Event>> {
  const url = `${endpoints.events.list(circuitId)}?page=${page}&limit=${limit}`;

  return httpClient<PaginatedResponse<Event>>(url);
}

export async function fetchEvent(id: string): Promise<Event> {
  return httpClient<Event>(endpoints.events.detail(id));
}
