import { queryKeys } from "@/shared/api";

import { fetchEventPassenger, fetchEventPassengers } from "./event-passenger.queries";

export function eventPassengerListOptions(eventId: string, page: number) {
  return {
    queryKey: queryKeys.eventPassengers.list(eventId, page),
    queryFn: () => fetchEventPassengers(eventId, page),
    enabled: Boolean(eventId),
  } as const;
}

export function eventPassengerDetailOptions(id: string) {
  return {
    queryKey: queryKeys.eventPassengers.detail(id),
    queryFn: () => fetchEventPassenger(id),
    enabled: Boolean(id),
  } as const;
}
