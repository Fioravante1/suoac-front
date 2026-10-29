"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import { eventDetailOptions, type Event } from "@/entities/event";
import { useMutation, useQuery, useQueryClient, type ActionResult } from "@/shared/api";
import { useAuthPermissions } from "@/shared/auth";

import { selectEventAction, selectedEventOptions } from "../../api";

const SELECT_EVENT_FAILURE: ActionResult<Event> = { success: false, error: "Não foi possível trocar o evento." };

export interface SelectedEventState {
  /**
   * Evento selecionado. `null` quando o circuito não tem evento atual (estado
   * "Circuito sem evento"); `undefined` enquanto carrega ou quando a falha deixou o
   * painel sem evento para mostrar.
   */
  event: Event | null | undefined;
  isLoading: boolean;
  /**
   * Não há evento para mostrar porque a resolução falhou: o shell mostra o estado de
   * erro, com `refetch` para tentar de novo. Com um evento já na tela, uma atualização
   * em segundo plano que falha mantém o evento e não acende o erro.
   */
  isError: boolean;
  refetch: () => void;
  isSelecting: boolean;
  /**
   * Troca o evento. Devolve o `ActionResult` para quem chamou mostrar a falha, e nunca
   * rejeita: a falha da chamada à Server Action (rede, deploy novo) também vira resultado.
   */
  selectEvent: (eventId: string) => Promise<ActionResult<Event>>;
}

const SelectedEventContext = createContext<SelectedEventState | null>(null);

type SelectedEventProviderProps = Readonly<{ children: ReactNode }>;

/**
 * Mantém o evento em que o shell novo trabalha: faixa, resumo e abas leem o mesmo
 * evento daqui, e nenhuma tela volta a escolher sozinha. Quem monta é o shell novo
 * (SUC-115); o shell antigo não monta, e as telas v1 seguem como sempre.
 *
 * A seleção diz qual é o evento; o conteúdo dele vem do cache do detalhe. Quem altera
 * um evento invalida o detalhe, e faixa, resumo e abas acompanham sem saber da seleção.
 */
export function SelectedEventProvider({ children }: SelectedEventProviderProps) {
  const { userCircuitId } = useAuthPermissions();
  const queryClient = useQueryClient();
  const selectionOptions = selectedEventOptions(userCircuitId);
  const selection = useQuery(selectionOptions);
  const selectedEventId = selection.data?.id ?? "";

  const detail = useQuery({
    ...eventDetailOptions(selectedEventId),
    // A resolução já trouxe o evento: o detalhe nasce com ele, sem outra ida à API.
    initialData: selection.data ?? undefined,
    initialDataUpdatedAt: selection.dataUpdatedAt,
    throwOnError: false,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (eventId: string) => selectEventAction(eventId),
    // A troca já devolve o evento conferido: gravar direto no cache faz faixa, resumo e
    // abas mudarem na hora, sem esperar outra ida à API.
    onSuccess: (result) => {
      if (!result.success) return;

      queryClient.setQueryData(eventDetailOptions(result.data.id).queryKey, result.data);
      queryClient.setQueryData(selectionOptions.queryKey, result.data);
    },
  });

  const selectEvent = useCallback(
    (eventId: string) => mutateAsync(eventId).catch(() => SELECT_EVENT_FAILURE),
    [mutateAsync],
  );

  const refetchSelection = selection.refetch;
  const refetchDetail = detail.refetch;
  const refetch = useCallback(() => {
    void refetchSelection();
    // `refetch` ignora o `enabled`: sem evento selecionado, não há detalhe a buscar.
    if (selectedEventId) void refetchDetail();
  }, [refetchSelection, refetchDetail, selectedEventId]);

  const event = selection.data === null ? null : detail.data;
  const isError = event === undefined && (selection.isError || detail.isError);
  const isLoading = event === undefined && !isError && (selection.isLoading || detail.isLoading);

  const value = useMemo<SelectedEventState>(
    () => ({ event, isLoading, isError, refetch, isSelecting: isPending, selectEvent }),
    [event, isLoading, isError, refetch, isPending, selectEvent],
  );

  return <SelectedEventContext value={value}>{children}</SelectedEventContext>;
}

/**
 * O evento selecionado no shell novo. Fora dele, devolve `null`: é o sinal para as
 * telas v1 continuarem escolhendo o evento como antes.
 */
export function useSelectedEvent(): SelectedEventState | null {
  return useContext(SelectedEventContext);
}
