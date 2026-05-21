"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

import { EVENT_STATUSES, type Event } from "@/entities/event";

export async function publishEventAction(eventId: string): Promise<ActionResult<Event>> {
  if (!eventId) {
    return { success: false, error: "Evento inválido." };
  }

  try {
    const data = await httpClient<Event>(endpoints.events.updateStatus(eventId), {
      method: "PATCH",
      body: { status: EVENT_STATUSES.OPEN },
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível abrir as inscrições.";

    return { success: false, error: message };
  }
}
