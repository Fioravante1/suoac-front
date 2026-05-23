"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

import { canUpdateEventDayTimes, type EventDayStatus, type EventStatus } from "@/entities/event";
import type { EventDay } from "@/entities/event-day";

import { updateEventDaySchema, type UpdateEventDayFormValues } from "../model";

import { mapUpdateEventDayFormToDto } from "./update-event-day.dto";

export async function updateEventDayAction(
  dayId: string,
  eventStatus: EventStatus,
  dayStatus: EventDayStatus,
  values: UpdateEventDayFormValues,
  original: { departureTime: string; returnTime: string },
): Promise<ActionResult<EventDay>> {
  if (!dayId) return { success: false, error: "Dia inválido." };

  if (!canUpdateEventDayTimes(eventStatus, dayStatus)) {
    return { success: false, error: "Os horários deste dia não podem ser alterados." };
  }

  const parsed = updateEventDaySchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: "Revise os campos destacados e tente novamente." };
  }

  const body = mapUpdateEventDayFormToDto(parsed.data, original);

  if (Object.keys(body).length === 0) {
    return { success: false, error: "Nenhuma alteração detectada." };
  }

  try {
    const data = await httpClient<EventDay>(endpoints.eventDays.update(dayId), {
      method: "PATCH",
      body: body as Record<string, unknown>,
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível atualizar os horários.";

    return { success: false, error: message };
  }
}
