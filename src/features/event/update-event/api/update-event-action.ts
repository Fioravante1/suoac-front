"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

import { canUpdateEventStatus, type Event } from "@/entities/event";

import { updateEventSchema, type UpdateEventFormValues } from "../model";

import { mapUpdateEventFormToDto, type EventBeingUpdated } from "./update-event.dto";

export async function updateEventAction(
  event: EventBeingUpdated & Pick<Event, "id">,
  values: UpdateEventFormValues,
): Promise<ActionResult<Event>> {
  if (!event.id) return { success: false, error: "Evento inválido." };
  if (!canUpdateEventStatus(event.status)) return { success: false, error: "Este evento não pode mais ser editado." };

  const parsed = updateEventSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: "Revise os campos destacados e tente novamente." };
  }

  try {
    const data = await httpClient<Event>(endpoints.events.update(event.id), {
      method: "PATCH",
      body: mapUpdateEventFormToDto(parsed.data, event),
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível atualizar o evento.";

    return { success: false, error: message };
  }
}
