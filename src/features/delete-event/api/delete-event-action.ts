"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

export async function deleteEventAction(eventId: string): Promise<ActionResult> {
  if (!eventId) return { success: false, error: "Evento inválido." };

  try {
    await httpClient<void>(endpoints.events.delete(eventId), { method: "DELETE" });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível excluir o evento.";

    return { success: false, error: message };
  }
}
