import type { Event } from "@/entities/event";
import { useSelectedEvent } from "@/features/select-event";
import { useAuthPermissions } from "@/shared/auth";

import { getEventOverview, type EventOverview } from "../event-overview";
import { hasEventTimeline } from "../event-summary";
import { useEventToday } from "../use-event-today";

export type EventOverviewState =
  | { status: "loading" }
  | { status: "hidden" }
  | {
      status: "ready";
      event: Event;
      overview: EventOverview;
      /** Quem vê é do circuito: as abas e as ações do circuito aparecem. */
      isCircuitUser: boolean;
      /** Encerrar inscrições e Cadastrar passageiro aparecem: circuito e inscrições abertas. */
      canAct: boolean;
    };

/**
 * O que o resumo do evento mostra, no desktop (`EventSummary`) e no celular (`EventHomeHero`):
 * carregando, nada (sem evento, ou rascunho e cancelado, que têm outro resumo no SUC-111) ou o
 * evento com o resumo calculado para o "hoje" de São Paulo. Uma regra só para as duas telas, para
 * elas nunca divergirem sobre etapas e ações.
 */
export function useEventOverview(): EventOverviewState {
  const selection = useSelectedEvent();
  const { isCircuitUser } = useAuthPermissions();
  const today = useEventToday();

  if (selection?.isLoading) return { status: "loading" };

  const event = selection?.event;

  if (!event || !hasEventTimeline(event.status)) return { status: "hidden" };

  const overview = getEventOverview(event, today);

  return { status: "ready", event, overview, isCircuitUser, canAct: isCircuitUser && overview.isRegistrationOpen };
}
