import { queryKeys } from "@/shared/api";

import { fetchPassenger, fetchPassengers } from "./passenger.queries";

export function passengerListOptions(congregationId: string, page: number, search: string) {
  return {
    queryKey: queryKeys.passengers.list(congregationId, page, search.trim()),
    queryFn: () => fetchPassengers(congregationId, page, 20, search),
    enabled: Boolean(congregationId),
  } as const;
}

export function passengerDetailOptions(id: string) {
  return {
    queryKey: queryKeys.passengers.detail(id),
    queryFn: () => fetchPassenger(id),
    enabled: Boolean(id),
  } as const;
}
