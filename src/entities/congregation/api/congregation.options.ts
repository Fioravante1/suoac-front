import { queryKeys } from "@/shared/api";

import { fetchCongregationEventStatuses, fetchCongregations, fetchCongregation } from "./congregation.queries";

export function congregationListOptions(circuitId: string, page: number) {
  return {
    queryKey: queryKeys.congregations.list(circuitId, page),
    queryFn: () => fetchCongregations(circuitId, page),
    enabled: Boolean(circuitId),
  } as const;
}

const SELECT_LIMIT = 100;

export function congregationSelectOptions(circuitId: string) {
  return {
    queryKey: queryKeys.congregations.select(circuitId),
    queryFn: () => fetchCongregations(circuitId, 1, SELECT_LIMIT),
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

export function congregationEventStatusesOptions(eventId: string) {
  return {
    queryKey: queryKeys.congregations.eventStatuses(eventId),
    queryFn: () => fetchCongregationEventStatuses(eventId),
    enabled: Boolean(eventId),
  } as const;
}
