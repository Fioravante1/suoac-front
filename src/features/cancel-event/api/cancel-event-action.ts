"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

import { EVENT_STATUSES, type Event } from "@/entities/event";

export async function cancelEventAction(eventId: string): Promise<ActionResult<Event>> {
  if (!eventId) {
    return { success: false, error: "Evento inválido." };
  }

  try {
    const data = await httpClient<Event>(endpoints.events.updateStatus(eventId), {
      method: "PATCH",
      body: { status: EVENT_STATUSES.CANCELLED },
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível cancelar o evento.";

    return { success: false, error: message };
  }
}
