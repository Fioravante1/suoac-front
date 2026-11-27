"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";

import type { CircuitSummary } from "../../model";

/**
 * Busca as contagens do circuito, autorizadas no backend somente para seus gestores.
 */
export async function fetchCircuitSummary(circuitId: string): Promise<CircuitSummary> {
  return httpClient<CircuitSummary>(endpoints.circuits.summary(circuitId));
}
