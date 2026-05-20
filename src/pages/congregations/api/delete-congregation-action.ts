"use server";

import { httpClient, endpoints } from "@/shared/api/http-client";

interface DeleteCongregationResult {
  success: boolean;
  error?: string;
}

export async function deleteCongregationAction(id: string): Promise<DeleteCongregationResult> {
  try {
    await httpClient(endpoints.congregations.delete(id), {
      method: "DELETE",
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir congregação.";
    return { success: false, error: message };
  }
}
