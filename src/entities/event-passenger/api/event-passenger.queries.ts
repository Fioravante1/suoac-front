"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { PaginatedResponse } from "@/shared/api/http-client";

import type { EventPassenger } from "../model";

export async function fetchEventPassengers(
  eventId: string,
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<EventPassenger>> {
  const url = `${endpoints.eventPassengers.list(eventId)}?page=${page}&limit=${limit}`;

  return httpClient<PaginatedResponse<EventPassenger>>(url);
}

export async function fetchEventPassenger(id: string): Promise<EventPassenger> {
  return httpClient<EventPassenger>(endpoints.eventPassengers.detail(id));
}
