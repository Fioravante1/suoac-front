"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

import type { Event } from "@/entities/event";

import { createEventSchema, type CreateEventFormValues } from "../model";

import { mapCreateEventFormToDto } from "./create-event.dto";

export async function createEventAction(
  circuitId: string,
  values: CreateEventFormValues,
): Promise<ActionResult<Event>> {
  const parsed = createEventSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: "Revise os campos destacados e tente novamente." };
  }

  try {
    const data = await httpClient<Event>(endpoints.events.create(circuitId), {
      method: "POST",
      body: { ...mapCreateEventFormToDto(parsed.data) },
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar o evento.";

    return { success: false, error: message };
  }
}
