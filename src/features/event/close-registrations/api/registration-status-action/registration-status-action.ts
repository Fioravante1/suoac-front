"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

import { EVENT_STATUSES, type Event, type EventStatus } from "@/entities/event";

async function transitionRegistrations(
  eventId: string,
  status: EventStatus,
  fallback: string,
): Promise<ActionResult<Event>> {
  if (!eventId) return { success: false, error: "Evento inválido." };

  try {
    const data = await httpClient<Event>(endpoints.events.updateStatus(eventId), {
      method: "PATCH",
      body: { status },
    });

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : fallback };
  }
}

/** Encerra as inscrições antes do prazo: `OPEN -> CLOSED`. */
export async function closeRegistrationsAction(eventId: string): Promise<ActionResult<Event>> {
  return transitionRegistrations(eventId, EVENT_STATUSES.CLOSED, "Não foi possível encerrar as inscrições.");
}

/** Reabre as inscrições encerradas antes do prazo: `CLOSED -> OPEN`. Depois do prazo, a API recusa. */
export async function reopenRegistrationsAction(eventId: string): Promise<ActionResult<Event>> {
  return transitionRegistrations(eventId, EVENT_STATUSES.OPEN, "Não foi possível reabrir as inscrições.");
}
