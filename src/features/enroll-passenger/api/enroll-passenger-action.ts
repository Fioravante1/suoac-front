"use server";

import type { EventPassenger } from "@/entities/event-passenger";
import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

import type { EnrollPassengerPayload } from "../model";

export async function enrollPassengerAction(
  eventId: string,
  payload: EnrollPassengerPayload,
): Promise<ActionResult<EventPassenger>> {
  if (!eventId) return { success: false, error: "Evento inválido." };

  try {
    const data = await httpClient<EventPassenger>(endpoints.eventPassengers.create(eventId), {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível inscrever o passageiro.";

    return { success: false, error: message };
  }
}
