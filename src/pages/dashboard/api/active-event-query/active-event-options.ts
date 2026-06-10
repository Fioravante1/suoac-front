import { queryKeys } from "@/shared/api";

import { fetchActiveEvent } from "./active-event-query";

export function activeEventOptions(circuitId: string) {
  return {
    queryKey: queryKeys.events.activeByCircuit(circuitId),
    queryFn: () => fetchActiveEvent(circuitId),
    enabled: Boolean(circuitId),
  } as const;
}
