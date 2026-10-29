import { queryKeys } from "@/shared/api";

import { resolveSelectedEventAction } from "../resolve-selected-event-action";

export function selectedEventOptions(circuitId: string) {
  return {
    queryKey: queryKeys.events.selected(circuitId),
    queryFn: () => resolveSelectedEventAction(),
    enabled: Boolean(circuitId),
    // A falha vira o estado de erro do painel. Subir para o error boundary derrubaria
    // o layout inteiro, e não só a área que depende do evento.
    throwOnError: false,
  } as const;
}
