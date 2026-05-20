"use server";

import { httpClient, endpoints } from "@/shared/api/http-client";

import type { Congregation } from "@/entities/congregation";

import type { CreateCongregationDto } from "./congregation.dto";

interface CreateCongregationResult {
  success: boolean;
  error?: string;
  data?: Congregation;
}

export async function createCongregationAction(
  circuitId: string,
  dto: CreateCongregationDto,
): Promise<CreateCongregationResult> {
  try {
    const data = await httpClient<Congregation>(endpoints.congregations.create(circuitId), {
      method: "POST",
      body: { ...dto },
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar congregação.";
    return { success: false, error: message };
  }
}
