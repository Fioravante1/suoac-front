import { USER_ROLES, isCircuitRole, type UserRole } from "@/shared/auth";

import { routes } from "@/shared/config";

export const PANEL_NAV_IDS = {
  HOME: "home",
  PASSENGERS: "passengers",
  FINANCIAL: "financial",
  TEAM: "team",
  MORE: "more",
} as const;

export type PanelNavId = (typeof PANEL_NAV_IDS)[keyof typeof PANEL_NAV_IDS];

export interface PanelNavItem {
  id: PanelNavId;
  label: string;
  /** Para onde o item leva. */
  href: string;
  /** As rotas que marcam o item como ativo: a dele e as subrotas de cada uma. */
  paths: readonly string[];
}

export const MORE_SCREEN_IDS = {
  BUSES: "buses",
  CONGREGATIONS: "congregations",
  LISTS: "lists",
} as const;

export type MoreScreenId = (typeof MORE_SCREEN_IDS)[keyof typeof MORE_SCREEN_IDS];

export interface MoreScreen {
  id: MoreScreenId;
  label: string;
  href: string;
}

/**
 * As telas que ficam atrás de "Mais" (`SUOAC Dashboard Mobile.dc.html`): no celular e no tablet
 * elas não têm item próprio na barra, e abrem empilhadas, com "‹ Mais" no topo para voltar.
 * Ônibus e Listas ainda são as telas de "a caminho" das Fatias 7 e 8 (SUC-108).
 */
export const MORE_SCREENS: readonly MoreScreen[] = [
  { id: MORE_SCREEN_IDS.BUSES, label: "Ônibus", href: routes.buses },
  { id: MORE_SCREEN_IDS.CONGREGATIONS, label: "Congregações", href: routes.congregations },
  { id: MORE_SCREEN_IDS.LISTS, label: "Listas e exportações", href: routes.lists },
];

/**
 * Os itens da barra de navegação do celular e do tablet: Início, Passageiros, Financeiro e Mais, na
 * ordem do desenho (o "+" fica entre Passageiros e Financeiro). Seguem as abas do desktop
 * (`getEventTabs`): Passageiros leva aos inscritos do evento selecionado, e ao cadastro do circuito
 * enquanto não há evento, para o item não apontar para um evento que não existe.
 */
export function getPanelNavItems(eventId: string | null, role: UserRole | null): PanelNavItem[] {
  const passengers: PanelNavItem = eventId
    ? {
        id: PANEL_NAV_IDS.PASSENGERS,
        label: "Passageiros",
        href: routes.eventEnrollments(eventId),
        paths: [routes.eventDetail(eventId), routes.passengers],
      }
    : { id: PANEL_NAV_IDS.PASSENGERS, label: "Passageiros", href: routes.passengers, paths: [routes.passengers] };

  if (!role) return [];
  const isCongregation = !isCircuitRole(role);
  const lastItem: PanelNavItem =
    role === USER_ROLES.CONGREGATION_COORDINATOR
      ? { id: PANEL_NAV_IDS.TEAM, label: "Equipe", href: routes.team, paths: [routes.team] }
      : {
          id: PANEL_NAV_IDS.MORE,
          label: "Mais",
          href: routes.more,
          paths: [routes.more, ...MORE_SCREENS.map((screen) => screen.href)],
        };
  return [
    { id: PANEL_NAV_IDS.HOME, label: "Início", href: routes.dashboard, paths: [routes.dashboard] },
    passengers,
    {
      id: PANEL_NAV_IDS.FINANCIAL,
      label: isCongregation ? "Pagamentos" : "Financeiro",
      href: routes.financial,
      paths: [routes.financial],
    },
    lastItem,
  ];
}

function isUnderPath(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** O item vale para a rota dele e para as subrotas, como `/congregations/123` em "Mais". */
export function isPanelNavItemActive(item: Pick<PanelNavItem, "paths">, pathname: string): boolean {
  return item.paths.some((path) => isUnderPath(pathname, path));
}

/** A tela está empilhada atrás de "Mais": mostra a barra "‹ Mais" e deixa "Mais" ativo. */
export function isStackedScreen(pathname: string): boolean {
  return MORE_SCREENS.some((screen) => isUnderPath(pathname, screen.href));
}
