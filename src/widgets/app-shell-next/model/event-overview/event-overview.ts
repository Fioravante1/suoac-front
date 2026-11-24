import { EVENT_STATUSES, canEnrollPassengers, getEventToday, isWithinReopenWindow, type Event } from "@/entities/event";

import { getEventSummary, type EventSummary } from "../event-summary";
import { getEventTimeline, type EventTimeline } from "../event-timeline";

export const REGISTRATION_ACTIONS = {
  CLOSE: "close",
  REOPEN: "reopen",
} as const;

/** O que o circuito pode fazer com as inscrições: encerrar as abertas ou reabrir as encerradas. */
export type RegistrationAction = (typeof REGISTRATION_ACTIONS)[keyof typeof REGISTRATION_ACTIONS];

export interface EventOverview {
  summary: EventSummary;
  timeline: EventTimeline;
  /**
   * As inscrições aceitam gente: Encerrar inscrições e Cadastrar passageiro aparecem. É a mesma
   * regra que deixa a linha de etapas na abertura, para as ações e as etapas nunca divergirem.
   */
  isRegistrationOpen: boolean;
  /**
   * As inscrições foram encerradas e ainda dá para reabrir: antes do prazo e com o evento por
   * terminar, como a API confere (`isWithinReopenWindow`).
   */
  isRegistrationReopenable: boolean;
}

/**
 * Tudo o que o resumo do evento mostra, no desktop e no celular, calculado para o mesmo "hoje"
 * de São Paulo.
 */
export function getEventOverview(event: Event, today: string = getEventToday()): EventOverview {
  return {
    summary: getEventSummary(event, today),
    timeline: getEventTimeline(event, today),
    isRegistrationOpen: canEnrollPassengers(event.status),
    isRegistrationReopenable: event.status === EVENT_STATUSES.CLOSED && isWithinReopenWindow(event, today),
  };
}
