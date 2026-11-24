import type { Event } from "@/entities/event";
import { useSelectedEvent } from "@/features/select-event";
import { useAuthPermissions } from "@/shared/auth";

import { REGISTRATION_ACTIONS, getEventOverview, type EventOverview, type RegistrationAction } from "../event-overview";
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
      /** Cadastrar passageiro aparece: circuito e inscrições abertas. */
      canEnroll: boolean;
      /** Encerrar ou Reabrir inscrições, para o circuito; `null` quando nenhum dos dois cabe. */
      registrationAction: RegistrationAction | null;
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

  return {
    status: "ready",
    event,
    overview,
    isCircuitUser,
    canEnroll: isCircuitUser && overview.isRegistrationOpen,
    registrationAction: resolveRegistrationAction(isCircuitUser, overview),
  };
}

function resolveRegistrationAction(isCircuitUser: boolean, overview: EventOverview): RegistrationAction | null {
  if (!isCircuitUser) return null;
  if (overview.isRegistrationOpen) return REGISTRATION_ACTIONS.CLOSE;
  if (overview.isRegistrationReopenable) return REGISTRATION_ACTIONS.REOPEN;

  return null;
}
