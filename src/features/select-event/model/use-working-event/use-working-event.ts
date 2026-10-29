import { activeEventOptions, type Event } from "@/entities/event";
import { useQuery } from "@/shared/api";

import { useSelectedEvent, type SelectedEventState } from "../selected-event-context";

export interface WorkingEventState {
  /** `null` quando não há evento a mostrar; `undefined` enquanto carrega ou depois de uma falha. */
  event: Event | null | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  /** A seleção do shell novo, para a tela trocar o evento do shell; `null` no shell antigo. */
  selection: SelectedEventState | null;
}

/**
 * O evento em que uma tela v1 trabalha. Dentro do shell novo, é o evento selecionado na
 * faixa, para a aba nunca mostrar um evento e a faixa outro. No shell antigo, que não
 * monta a seleção, continua sendo o evento com inscrições abertas do circuito.
 *
 * É o único lugar em que as telas v1 distinguem os dois shells, e quem decide continua
 * sendo o arquivo de rota, que monta ou não o `SelectedEventProvider`. Sai junto com o
 * shell antigo, no corte.
 */
export function useWorkingEvent(circuitId: string): WorkingEventState {
  const selection = useSelectedEvent();

  const activeEventQuery = useQuery({
    ...activeEventOptions(circuitId),
    // Com seleção, a consulta própria seria uma segunda fonte de evento, e a errada.
    enabled: selection === null && Boolean(circuitId),
  });

  if (selection) {
    return {
      event: selection.event,
      isLoading: selection.isLoading,
      isError: selection.isError,
      refetch: selection.refetch,
      selection,
    };
  }

  return {
    event: activeEventQuery.data,
    isLoading: activeEventQuery.isLoading,
    isError: activeEventQuery.isError,
    refetch: () => void activeEventQuery.refetch(),
    selection: null,
  };
}
