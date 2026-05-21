import { queryKeys } from "@/shared/api";

import { fetchEvent, fetchEvents } from "./event.queries";

export function eventListOptions(circuitId: string, page: number) {
  return {
    queryKey: queryKeys.events.list(circuitId, page),
    queryFn: () => fetchEvents(circuitId, page),
    enabled: Boolean(circuitId),
  } as const;
}

export function eventDetailOptions(id: string) {
  return {
    queryKey: queryKeys.events.detail(id),
    queryFn: () => fetchEvent(id),
    enabled: Boolean(id),
  } as const;
}
