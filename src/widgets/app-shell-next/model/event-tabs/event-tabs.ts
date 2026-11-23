import { routes } from "@/shared/config";

export const EVENT_TAB_IDS = {
  OVERVIEW: "overview",
  PASSENGERS: "passengers",
  FINANCIAL: "financial",
  CONGREGATIONS: "congregations",
  BUSES: "buses",
  LISTS: "lists",
} as const;

export type EventTabId = (typeof EVENT_TAB_IDS)[keyof typeof EVENT_TAB_IDS];

export interface EventTab {
  id: EventTabId;
  label: string;
  /** Para onde a aba leva. */
  href: string;
  /** A rota que marca a aba como ativa: o `href` sem a âncora. */
  path: string;
}

function tabTo(id: EventTabId, label: string, path: string, href: string = path): EventTab {
  return { id, label, href, path };
}

/**
 * As abas do painel do circuito no desktop, na ordem do `v3`, para o evento selecionado. Cada aba
 * é uma rota: a aba ativa vem da URL, e voltar no navegador volta de aba. As dos papéis da
 * congregação são o SUC-113.
 *
 * Passageiros leva aos inscritos do evento, no detalhe dele, até a Fatia 4 (SUC-8) trazer a tela
 * nova: o contador da aba é o de inscritos, e `/passengers` é o cadastro do circuito inteiro.
 */
export function getEventTabs(eventId: string): EventTab[] {
  return [
    tabTo(EVENT_TAB_IDS.OVERVIEW, "Visão geral", routes.dashboard),
    tabTo(EVENT_TAB_IDS.PASSENGERS, "Passageiros", routes.eventDetail(eventId), routes.eventEnrollments(eventId)),
    tabTo(EVENT_TAB_IDS.FINANCIAL, "Financeiro", routes.financial),
    tabTo(EVENT_TAB_IDS.CONGREGATIONS, "Congregações", routes.congregations),
    tabTo(EVENT_TAB_IDS.BUSES, "Ônibus", routes.buses),
    tabTo(EVENT_TAB_IDS.LISTS, "Listas e exportações", routes.lists),
  ];
}

/** A aba vale para a rota dela e para as subrotas, como `/congregations/123`. */
export function isEventTabActive(tab: Pick<EventTab, "path">, pathname: string): boolean {
  return pathname === tab.path || pathname.startsWith(`${tab.path}/`);
}
