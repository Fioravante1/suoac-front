import {
  CONGREGATION_LIST_STATUSES,
  congregationEventStatusOptions,
  type CongregationListStatus,
} from "@/entities/congregation";
import { useQuery } from "@/shared/api";

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
      /** Papéis que gerenciam inscrições de todo o circuito. */
      isCircuitUser: boolean;
      /** Cadastro com inscrições abertas e, para congregação, lista pendente já carregada. */
      canEnroll: boolean;
      /** Motivo acessível do cadastro bloqueado, específico ao estado e ao papel. */
      enrollDisabledReason: string | null;
      /** Exibe a ação da própria lista enquanto as inscrições estão abertas. */
      canToggleListStatus: boolean;
      /** Pode finalizar e reabrir a própria lista. */
      isCongregationCoordinator: boolean;
      /** Recebe explicação de que a finalização cabe ao coordenador do arranjo. */
      isCongregationAssistant: boolean;
      /** Situação confirmada pela API; null para circuito ou enquanto indisponível. */
      congregationListStatus: CongregationListStatus | null;
      /** A consulta da própria lista falhou e oferece recuperação explícita. */
      isCongregationListError: boolean;
      /** Reconsulta a própria lista sem alterar o estado local por antecipação. */
      retryCongregationList: () => void;
      /** Encerrar ou Reabrir inscrições para circuito; null nos demais casos. */
      registrationAction: RegistrationAction | null;
    };

/**
 * O que o resumo do evento mostra, no desktop (`EventSummary`) e no celular (`EventHomeHero`):
 * carregando, nada (sem evento, ou rascunho e cancelado, que têm outro resumo no SUC-111) ou o
 * evento com o resumo calculado para o "hoje" de São Paulo. Uma regra só para as duas telas, para
 * elas nunca divergirem sobre etapas e ações. `includeInactive` permite ao resumo desktop
 * reaproveitar o cálculo para os heroes de rascunho e cancelado, sem oferecer ações de inscrições.
 */
export function useEventOverview({ includeInactive = false }: { includeInactive?: boolean } = {}): EventOverviewState {
  const selection = useSelectedEvent();
  const { isCircuitUser, userCongregationId, isCongregationCoordinator, isCongregationAssistant } =
    useAuthPermissions();
  const today = useEventToday();
  const list = useQuery({
    ...congregationEventStatusOptions(selection?.event?.id ?? "", userCongregationId ?? ""),
    enabled: !isCircuitUser && Boolean(selection?.event?.id && userCongregationId),
    throwOnError: false,
  });

  if (selection?.isLoading) return { status: "loading" };

  const event = selection?.event;

  if (!event || (!includeInactive && !hasEventTimeline(event.status))) return { status: "hidden" };

  const overview = getEventOverview(event, today);

  return {
    status: "ready",
    event,
    overview,
    isCircuitUser,
    canEnroll:
      overview.isRegistrationOpen && (isCircuitUser || list.data?.status === CONGREGATION_LIST_STATUSES.PENDING),
    enrollDisabledReason: resolveEnrollDisabledReason(isCircuitUser, overview, list.data?.status ?? null, list.isError),
    canToggleListStatus: !isCircuitUser && overview.isRegistrationOpen,
    isCongregationCoordinator,
    isCongregationAssistant,
    isCongregationListError: list.isError,
    retryCongregationList: () => {
      list.refetch();
    },
    congregationListStatus: isCircuitUser ? null : (list.data?.status ?? null),
    registrationAction: resolveRegistrationAction(isCircuitUser, overview),
  };
}

function resolveRegistrationAction(isCircuitUser: boolean, overview: EventOverview): RegistrationAction | null {
  if (!isCircuitUser) return null;
  if (overview.isRegistrationOpen) return REGISTRATION_ACTIONS.CLOSE;
  if (overview.isRegistrationReopenable) return REGISTRATION_ACTIONS.REOPEN;

  return null;
}

/** Explica o bloqueio real sem mencionar a lista da congregação aos papéis de circuito. */
function resolveEnrollDisabledReason(
  isCircuitUser: boolean,
  overview: EventOverview,
  status: CongregationListStatus | null,
  isListError: boolean,
): string | null {
  if (!overview.isRegistrationOpen) return "As inscrições não estão abertas.";
  if (isCircuitUser) return null;
  if (status === CONGREGATION_LIST_STATUSES.FINALIZED) return "A lista da congregação já foi finalizada.";
  if (!status && isListError) return "Não foi possível confirmar o status da lista da congregação.";
  if (!status) return "Carregando o status da lista da congregação.";
  return null;
}
