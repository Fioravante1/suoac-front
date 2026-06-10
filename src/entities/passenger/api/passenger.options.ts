import { queryKeys } from "@/shared/api";

import { fetchCircuitPassengers, fetchPassenger, fetchPassengers } from "./passenger.queries";

export function passengerListOptions(congregationId: string, page: number, search: string) {
  return {
    queryKey: queryKeys.passengers.list(congregationId, page, search.trim()),
    queryFn: () => fetchPassengers(congregationId, page, 10, search),
    enabled: Boolean(congregationId),
  } as const;
}

export function passengerListByCircuitOptions(circuitId: string, page: number, search: string, congregationId: string) {
  return {
    queryKey: queryKeys.passengers.listByCircuit(circuitId, page, search.trim(), congregationId),
    queryFn: () => fetchCircuitPassengers(circuitId, page, 10, search, congregationId),
    enabled: Boolean(circuitId),
  } as const;
}

export function passengerDetailOptions(id: string) {
  return {
    queryKey: queryKeys.passengers.detail(id),
    queryFn: () => fetchPassenger(id),
    enabled: Boolean(id),
  } as const;
}
