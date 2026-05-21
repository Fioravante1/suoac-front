import { queryKeys } from "@/shared/api";

import { fetchEventDay, fetchEventDays } from "./event-day.queries";

export function eventDayListOptions(eventId: string) {
  return {
    queryKey: queryKeys.eventDays.list(eventId),
    queryFn: () => fetchEventDays(eventId),
    enabled: Boolean(eventId),
  } as const;
}

export function eventDayDetailOptions(id: string) {
  return {
    queryKey: queryKeys.eventDays.detail(id),
    queryFn: () => fetchEventDay(id),
    enabled: Boolean(id),
  } as const;
}
