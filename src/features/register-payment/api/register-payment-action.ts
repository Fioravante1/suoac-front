"use server";

import type { Payment } from "@/entities/payment";
import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

import type { CreatePaymentPayload } from "../model";

export async function registerPaymentAction(
  eventPassengerId: string,
  payload: CreatePaymentPayload,
): Promise<ActionResult<Payment>> {
  if (!eventPassengerId) return { success: false, error: "Inscrição inválida." };

  try {
    const data = await httpClient<Payment>(endpoints.payments.create(eventPassengerId), {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
    });

    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível registrar o pagamento.";

    return { success: false, error: message };
  }
}
