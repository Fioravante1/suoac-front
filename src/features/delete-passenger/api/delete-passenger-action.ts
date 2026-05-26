"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

export async function deletePassengerAction(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "Passageiro inválido." };

  try {
    await httpClient<void>(endpoints.passengers.delete(id), { method: "DELETE" });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível excluir o passageiro.";

    return { success: false, error: message };
  }
}
