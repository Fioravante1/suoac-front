"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";

import type { EventDay } from "../model";

export async function fetchEventDays(eventId: string): Promise<EventDay[]> {
  return httpClient<EventDay[]>(endpoints.eventDays.list(eventId));
}

export async function fetchEventDay(id: string): Promise<EventDay> {
  return httpClient<EventDay>(endpoints.eventDays.detail(id));
}
