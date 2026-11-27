import { useAuthPermissions } from "@/shared/auth";

import { congregationListOptions } from "@/entities/congregation";
import { eventPassengerListOptions } from "@/entities/event-passenger";
import { useQuery, type PaginatedResponse } from "@/shared/api";

import { EVENT_TAB_IDS, type EventTabId } from "../event-tabs";

export type EventTabCounts = Partial<Record<EventTabId, number>>;

function selectTotal<T>(response: PaginatedResponse<T>): number {
  return response.meta.total;
}

/**
 * Os contadores das abas, no lugar em que o `v3` os mostra: os inscritos no evento e as
 * congregações do circuito, pelo total da primeira página de cada lista. Inscrever alguém
 * invalida a lista de inscritos e atualiza o contador junto.
 *
 * Congregações conta as do circuito até existir a escolha de quem participa do evento (SUC-102).
 * Ônibus não tem contador até a Fatia 7 (SUC-11). Enquanto carrega ou depois de uma falha, o
 * contador fica de fora, como o desenho faz com contador vazio: um número que falhou não é
 * motivo para derrubar a tela, então a falha não sobe para o error boundary.
 */
export function useEventTabCounts(eventId: string, circuitId: string): EventTabCounts {
  const { isCircuitUser } = useAuthPermissions();
  const passengers = useQuery({ ...eventPassengerListOptions(eventId, 1), select: selectTotal, throwOnError: false });
  const congregations = useQuery({
    ...congregationListOptions(circuitId, 1),
    enabled: isCircuitUser && Boolean(circuitId),
    select: selectTotal,
    throwOnError: false,
  });

  return {
    [EVENT_TAB_IDS.PASSENGERS]: passengers.data,
    [EVENT_TAB_IDS.CONGREGATIONS]: congregations.data,
  };
}
