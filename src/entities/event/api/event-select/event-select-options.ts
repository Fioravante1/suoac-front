import { queryKeys } from "@/shared/api";

import { fetchEvents } from "../event.queries";

/**
 * Limite de eventos carregados para popular seletores (dropdowns). Espelha o padrão de
 * `congregationSelectOptions`. Assume que um circuito não terá mais de 100 eventos no horizonte do
 * MVP (eventos são sazonais). Se esse limite deixar de valer, migrar para um endpoint dedicado de
 * seleção ou um seletor com busca/paginação sob demanda.
 */
const SELECT_LIMIT = 100;

export function eventSelectOptions(circuitId: string) {
  return {
    queryKey: queryKeys.events.select(circuitId),
    queryFn: () => fetchEvents(circuitId, 1, SELECT_LIMIT),
    enabled: Boolean(circuitId),
  } as const;
}
