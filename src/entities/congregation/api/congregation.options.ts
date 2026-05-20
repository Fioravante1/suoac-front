import { queryKeys } from "@/shared/api";

import { fetchCongregations, fetchCongregation } from "./congregation.queries";

export function congregationListOptions(circuitId: string, page: number) {
  return {
    queryKey: queryKeys.congregations.list(circuitId, page),
    queryFn: () => fetchCongregations(circuitId, page),
    enabled: Boolean(circuitId),
  } as const;
}

export function congregationDetailOptions(id: string) {
  return {
    queryKey: queryKeys.congregations.detail(id),
    queryFn: () => fetchCongregation(id),
    enabled: Boolean(id),
  } as const;
}
