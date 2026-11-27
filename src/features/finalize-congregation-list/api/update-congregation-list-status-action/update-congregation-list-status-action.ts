"use server";

import type { CongregationEventStatus, CongregationListStatus } from "@/entities/congregation";
import type { ActionResult } from "@/shared/api";
import { endpoints, httpClient } from "@/shared/api/http-client";

/** Finaliza ou reabre a lista sem perder a mensagem de regra de negócio da API. */
export async function updateCongregationListStatusAction(
  eventId: string,
  congregationId: string,
  status: CongregationListStatus,
): Promise<ActionResult<CongregationEventStatus>> {
  if (!eventId || !congregationId) return { success: false, error: "Lista inválida." };
  try {
    const data = await httpClient<CongregationEventStatus>(
      endpoints.events.congregationStatus(eventId, congregationId),
      { method: "PATCH", body: { status } },
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível atualizar a lista." };
  }
}
