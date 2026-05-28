"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";
import type { ActionResult } from "@/shared/api";

export async function deletePaymentAction(paymentId: string): Promise<ActionResult> {
  if (!paymentId) return { success: false, error: "Pagamento inválido." };

  try {
    await httpClient<void>(endpoints.payments.delete(paymentId), { method: "DELETE" });

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível remover o pagamento.";

    return { success: false, error: message };
  }
}
