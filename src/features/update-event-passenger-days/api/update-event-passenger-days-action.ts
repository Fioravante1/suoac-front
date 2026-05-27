"use server";

import type { EventPassenger } from "@/entities/event-passenger";
import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

export async function updateEventPassengerDaysAction(
  eventPassengerId: string,
  dayIds: string[],
): Promise<ActionResult<EventPassenger>> {
  if (!eventPassengerId) return { success: false, error: "Inscrição inválida." };
  if (!dayIds.length) return { success: false, error: "Selecione pelo menos um dia." };

  try {
    const data = await httpClient<EventPassenger>(endpoints.eventPassengers.updateDays(eventPassengerId), {
      method: "PATCH",
      body: { dayIds },
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível atualizar os dias.";

    return { success: false, error: message };
  }
}
