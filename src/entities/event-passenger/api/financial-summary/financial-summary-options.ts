import { queryKeys } from "@/shared/api";

import { fetchFinancialSummary } from "./financial-summary-query";

export function financialSummaryOptions(eventId: string) {
  return {
    queryKey: queryKeys.financialSummary.byEvent(eventId),
    queryFn: () => fetchFinancialSummary(eventId),
    enabled: Boolean(eventId),
  } as const;
}
