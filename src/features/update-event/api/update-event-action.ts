"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

import { canUpdateEventStatus, type Event, type EventStatus } from "@/entities/event";

import { updateEventSchema, type UpdateEventFormValues } from "../model";

import { mapUpdateEventFormToDto } from "./update-event.dto";

export async function updateEventAction(
  eventId: string,
  status: EventStatus,
  values: UpdateEventFormValues,
): Promise<ActionResult<Event>> {
  if (!eventId) return { success: false, error: "Evento inválido." };
  if (!canUpdateEventStatus(status)) return { success: false, error: "Este evento não pode mais ser editado." };

  const parsed = updateEventSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: "Revise os campos destacados e tente novamente." };
  }

  try {
    const data = await httpClient<Event>(endpoints.events.update(eventId), {
      method: "PATCH",
      body: mapUpdateEventFormToDto(parsed.data, status),
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível atualizar o evento.";

    return { success: false, error: message };
  }
}
