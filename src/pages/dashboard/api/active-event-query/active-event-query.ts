"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { PaginatedResponse } from "@/shared/api/http-client";
import { EVENT_STATUSES } from "@/entities/event";
import type { Event } from "@/entities/event";

export async function fetchActiveEvent(circuitId: string): Promise<Event | null> {
  let page = 1;

  while (true) {
    const url = `${endpoints.events.list(circuitId)}?page=${page}&limit=20`;
    const response = await httpClient<PaginatedResponse<Event>>(url);
    const openEvent = response.data.find((event) => event.status === EVENT_STATUSES.OPEN);

    if (openEvent) return openEvent;
    if (page >= response.meta.totalPages) return null;

    page++;
  }
}
