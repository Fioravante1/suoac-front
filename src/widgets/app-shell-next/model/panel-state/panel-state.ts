import { EVENT_STATUSES, type Event } from "@/entities/event";

export const PANEL_MODES = { LIVE: "live", EMPTY: "empty", DRAFT: "draft", CANCELLED: "cancelled" } as const;
export type PanelMode = (typeof PANEL_MODES)[keyof typeof PANEL_MODES];

/**
 * Resolve o estado do painel; rascunho de congregação equivale a ausência de evento.
 */
export function resolvePanelMode(event: Event | null | undefined, isCircuitUser: boolean): PanelMode | null {
  if (event === undefined) return null;
  if (event === null) return PANEL_MODES.EMPTY;
  if (event.status === EVENT_STATUSES.DRAFT && !isCircuitUser) return PANEL_MODES.EMPTY;
  if (event.status === EVENT_STATUSES.DRAFT) return PANEL_MODES.DRAFT;
  if (event.status === EVENT_STATUSES.CANCELLED) return PANEL_MODES.CANCELLED;
  return PANEL_MODES.LIVE;
}
