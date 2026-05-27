"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

export async function removeEventPassengerAction(eventPassengerId: string): Promise<ActionResult> {
  if (!eventPassengerId) return { success: false, error: "Inscrição inválida." };

  try {
    await httpClient<void>(endpoints.eventPassengers.delete(eventPassengerId), { method: "DELETE" });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível remover a inscrição.";

    return { success: false, error: message };
  }
}
