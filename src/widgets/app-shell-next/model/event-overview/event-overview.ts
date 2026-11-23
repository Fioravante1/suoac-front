import { canEnrollPassengers, getEventToday, type Event } from "@/entities/event";

import { getEventSummary, type EventSummary } from "../event-summary";
import { getEventTimeline, type EventTimeline } from "../event-timeline";

export interface EventOverview {
  summary: EventSummary;
  timeline: EventTimeline;
  /**
   * As inscrições aceitam gente: Encerrar inscrições e Cadastrar passageiro aparecem. É a mesma
   * regra que deixa a linha de etapas na abertura, para as ações e as etapas nunca divergirem.
   */
  isRegistrationOpen: boolean;
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
  };
}
