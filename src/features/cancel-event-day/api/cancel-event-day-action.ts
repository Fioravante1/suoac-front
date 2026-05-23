"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

import type { EventDay } from "@/entities/event-day";

export async function cancelEventDayAction(dayId: string): Promise<ActionResult<EventDay>> {
  if (!dayId) return { success: false, error: "Dia inválido." };

  try {
    const data = await httpClient<EventDay>(endpoints.eventDays.cancel(dayId), {
      method: "PATCH",
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível cancelar o dia.";

    return { success: false, error: message };
  }
}
