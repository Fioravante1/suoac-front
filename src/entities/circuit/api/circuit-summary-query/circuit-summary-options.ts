import { queryKeys } from "@/shared/api";

import { fetchCircuitSummary } from "./circuit-summary-query";

/**
 * Isola as contagens por circuito e deixa falhas com o card, que oferece nova tentativa.
 */
export function circuitSummaryOptions(circuitId: string) {
  return {
    queryKey: queryKeys.circuits.summary(circuitId),
    queryFn: () => fetchCircuitSummary(circuitId),
    enabled: Boolean(circuitId),
    throwOnError: false,
  } as const;
}
