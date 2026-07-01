"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";

import type { FinancialSummary } from "../../model";

import { mapFinancialSummary, type FinancialSummaryDto } from "./financial-summary.dto";

/**
 * Busca o resumo financeiro do evento. O backend resolve o escopo pelo JWT (circuito vê todas as
 * congregações; congregação vê apenas a própria).
 */
export async function fetchFinancialSummary(eventId: string): Promise<FinancialSummary> {
  const dto = await httpClient<FinancialSummaryDto>(endpoints.events.financialSummary(eventId));

  return mapFinancialSummary(dto);
}
