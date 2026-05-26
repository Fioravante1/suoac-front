"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

import {
  normalizePassengerFormValues,
  passengerFormSchema,
  type Passenger,
  type PassengerFormValues,
} from "@/entities/passenger";

export async function createPassengerAction(
  congregationId: string,
  values: PassengerFormValues,
): Promise<ActionResult<Passenger>> {
  if (!congregationId) return { success: false, error: "Congregação inválida." };

  const parsed = passengerFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: "Revise os campos destacados e tente novamente." };
  }

  try {
    const data = await httpClient<Passenger>(endpoints.passengers.create(congregationId), {
      method: "POST",
      body: normalizePassengerFormValues(parsed.data),
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar o passageiro.";

    return { success: false, error: message };
  }
}
