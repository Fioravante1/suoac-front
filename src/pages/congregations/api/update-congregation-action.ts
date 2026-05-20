"use server";

import { httpClient, endpoints } from "@/shared/api/http-client";

import type { Congregation } from "@/entities/congregation";

import type { UpdateCongregationDto } from "./congregation.dto";

interface UpdateCongregationResult {
  success: boolean;
  error?: string;
  data?: Congregation;
}

export async function updateCongregationAction(
  id: string,
  dto: UpdateCongregationDto,
): Promise<UpdateCongregationResult> {
  try {
    const data = await httpClient<Congregation>(endpoints.congregations.update(id), {
      method: "PATCH",
      body: { ...dto },
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar congregação.";
    return { success: false, error: message };
  }
}
