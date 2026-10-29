import { useState } from "react";

import { eventSelectOptions, type Event } from "@/entities/event";
import { useWorkingEvent } from "@/features/select-event";
import { useQuery } from "@/shared/api";
import { useToast } from "@/shared/ui/toast";

export interface FinancialEventState {
  /** Eventos do seletor da tela. */
  events: Event[];
  /** Evento cujo financeiro a tela mostra; vazio quando não há nenhum. */
  eventId: string;
  isBootstrapping: boolean;
  /** Não há evento para mostrar porque o evento selecionado no shell novo não carregou. */
  isError: boolean;
  retry: () => void;
  /** Uma troca de evento está a caminho do shell. */
  isChangingEvent: boolean;
  /** Troca o evento pelo seletor da própria tela. */
  changeEvent: (eventId: string) => void;
}

/** O evento selecionado entra no seletor mesmo quando fica fora da primeira página da lista. */
function withSelectedEvent(events: Event[], selected: Event | null | undefined): Event[] {
  if (!selected || events.some((event) => event.id === selected.id)) return events;

  return [selected, ...events];
}

/**
 * O evento do Financeiro. Dentro do shell novo, é o evento selecionado na faixa, e o
 * seletor da tela troca a seleção do shell inteiro: faixa e aba nunca mostram
 * eventos diferentes. No shell antigo, a escolha continua local, com o evento de
 * inscrições abertas (ou o primeiro da lista) como padrão.
 */
export function useFinancialEvent(circuitId: string): FinancialEventState {
  const workingEvent = useWorkingEvent(circuitId);
  const toast = useToast();
  // Escolha feita no seletor desta tela que o shell ainda não reflete: no shell antigo,
  // nunca reflete; no novo, só até a troca voltar.
  const [chosenEventId, setChosenEventId] = useState("");

  const eventsQuery = useQuery(eventSelectOptions(circuitId));

  const events = eventsQuery.data?.data ?? [];
  const isBootstrapping = eventsQuery.isLoading || workingEvent.isLoading;
  const { selection } = workingEvent;

  if (selection) {
    return {
      events: withSelectedEvent(events, workingEvent.event),
      eventId: chosenEventId || workingEvent.event?.id || "",
      isBootstrapping,
      isError: workingEvent.isError,
      retry: workingEvent.refetch,
      isChangingEvent: selection.isSelecting,
      changeEvent: (eventId) => {
        // A tela mostra o evento escolhido na hora; se a troca falhar, volta ao do shell.
        setChosenEventId(eventId);
        void selection.selectEvent(eventId).then((result) => {
          setChosenEventId("");
          if (!result.success) toast.error(result.error);
        });
      },
    };
  }

  return {
    events,
    // Default: evento ativo (OPEN); se não houver, o primeiro da lista. A escolha do usuário prevalece.
    eventId: chosenEventId || workingEvent.event?.id || events[0]?.id || "",
    isBootstrapping,
    isError: false,
    retry: workingEvent.refetch,
    isChangingEvent: false,
    changeEvent: setChosenEventId,
  };
}
