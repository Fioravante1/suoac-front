import { useMemo } from "react";

import {
  EVENT_STATUS_BADGE_VARIANTS,
  EVENT_STATUS_LABELS,
  canUpdateEventStatus,
  eventSelectOptions,
  getEventPeriod,
  sortEventsByPeriod,
  type Event,
  type EventStatusVariant,
} from "@/entities/event";
import { useQuery, useQueryClient } from "@/shared/api";
import { useAuthPermissions } from "@/shared/auth";
import { routes } from "@/shared/config";
import { formatShortDateRange } from "@/shared/lib";
import { useToast } from "@/shared/ui/toast";

import { useSelectedEvent } from "../selected-event-context";

export interface EventSwitcherItem {
  id: string;
  title: string;
  /** Período curto, como "23–25 out"; vazio quando o evento não tem dias. */
  period: string;
  statusLabel: string;
  statusVariant: EventStatusVariant;
  /** Linha de apoio do item: período e status ("23–25 out · Inscrições abertas"). */
  meta: string;
  isSelected: boolean;
}

export interface EventSwitcherState {
  /** Evento selecionado: `null` em circuito sem evento; `undefined` enquanto carrega ou depois de uma falha. */
  current: EventSwitcherItem | null | undefined;
  isCurrentLoading: boolean;
  /** Eventos do circuito, do mais recente para o mais antigo. */
  events: EventSwitcherItem[];
  /** Não há lista para mostrar e ela está a caminho, inclusive numa nova tentativa. */
  isLoadingEvents: boolean;
  /**
   * Não há lista para mostrar porque a busca falhou. Com a lista já na tela, uma
   * atualização em segundo plano que falha mantém a lista e não acende o erro.
   */
  isEventsError: boolean;
  retryEvents: () => void;
  /** Busca a lista antes de o seletor abrir, para ele já abrir com os eventos. */
  prefetchEvents: () => void;
  isSelecting: boolean;
  /**
   * Troca o evento do shell inteiro e avisa o resultado. Escolher o evento atual, ou
   * escolher outro com uma troca ainda a caminho, não faz nada.
   */
  selectEvent: (eventId: string) => void;
  /** `null` quando o papel não cria eventos. */
  createEventHref: string | null;
  /** `null` quando o papel não edita eventos ou quando o status do evento não aceita edição. */
  editEventHref: string | null;
}

interface UseEventSwitcherOptions {
  /** Com o seletor fechado, a lista não é buscada. */
  isOpen: boolean;
}

const MISSING_PROVIDER = "useEventSwitcher precisa do SelectedEventProvider, que o shell novo monta.";

function toItem(event: Event, selectedId: string | undefined, today: Date): EventSwitcherItem {
  const range = getEventPeriod(event.days ?? []);
  const period = range ? formatShortDateRange(range.start, range.end, today) : "";
  const statusLabel = EVENT_STATUS_LABELS[event.status];

  return {
    id: event.id,
    title: event.title,
    period,
    statusLabel,
    statusVariant: EVENT_STATUS_BADGE_VARIANTS[event.status],
    meta: [period, statusLabel].filter(Boolean).join(" · "),
    isSelected: event.id === selectedId,
  };
}

/**
 * O seletor de evento do shell novo, nas duas formas: o menu da faixa no desktop e a
 * sheet do topo no celular e no tablet. Lista os eventos do circuito (os papéis da
 * congregação recebem a lista já sem rascunhos) e troca o evento de todo o painel.
 */
export function useEventSwitcher({ isOpen }: UseEventSwitcherOptions): EventSwitcherState {
  const selection = useSelectedEvent();
  const { userCircuitId, isCircuitUser } = useAuthPermissions();
  const queryClient = useQueryClient();
  const toast = useToast();
  const listOptions = eventSelectOptions(userCircuitId);
  const eventsQuery = useQuery({
    ...listOptions,
    enabled: isOpen && listOptions.enabled,
    // A falha aparece dentro do seletor, com nova tentativa, e não derruba a página.
    throwOnError: false,
  });
  const selected = selection?.event;
  const selectedId = selected?.id;
  const listedEvents = eventsQuery.data?.data;

  // O seletor fica montado na faixa o tempo todo: a lista só é ordenada de novo quando muda.
  const events = useMemo(() => {
    const today = new Date();

    return sortEventsByPeriod(listedEvents ?? []).map((event) => toItem(event, selectedId, today));
  }, [listedEvents, selectedId]);

  if (!selection) throw new Error(MISSING_PROVIDER);

  const { isSelecting, selectEvent: changeSelectedEvent } = selection;
  const hasList = listedEvents !== undefined;
  const canEditSelected = isCircuitUser && selected && canUpdateEventStatus(selected.status);

  function selectEvent(eventId: string) {
    if (eventId === selectedId || isSelecting) return;

    void changeSelectedEvent(eventId).then((result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Evento alterado para ${result.data.title}`);
    });
  }

  function prefetchEvents() {
    if (!listOptions.enabled) return;

    void queryClient.prefetchQuery({ queryKey: listOptions.queryKey, queryFn: listOptions.queryFn });
  }

  return {
    current: selected ? toItem(selected, selectedId, new Date()) : selected,
    isCurrentLoading: selection.isLoading,
    events,
    // `isLoading` do TanStack fica falso numa nova tentativa depois de um erro.
    isLoadingEvents: !hasList && eventsQuery.isFetching,
    isEventsError: !hasList && eventsQuery.isError && !eventsQuery.isFetching,
    retryEvents: () => void eventsQuery.refetch(),
    prefetchEvents,
    isSelecting,
    selectEvent,
    createEventHref: isCircuitUser ? routes.events : null,
    editEventHref: canEditSelected ? routes.eventDetail(selected.id) : null,
  };
}
