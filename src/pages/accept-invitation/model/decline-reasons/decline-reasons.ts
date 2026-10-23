/**
 * Motivos de recusa do desenho. O backend ainda nao recebe a recusa (SUC-68), e
 * os valores existem aqui para a tela ja ser a definitiva quando ele chegar.
 */
export const DECLINE_REASONS = {
  NOT_THE_PERSON: "NOT_THE_PERSON",
  CANNOT_ASSUME: "CANNOT_ASSUME",
  RECEIVED_BY_MISTAKE: "RECEIVED_BY_MISTAKE",
} as const;

export type DeclineReason = (typeof DECLINE_REASONS)[keyof typeof DECLINE_REASONS];

export const DECLINE_REASON_LABELS: Record<DeclineReason, string> = {
  NOT_THE_PERSON: "Não sou a pessoa indicada",
  CANNOT_ASSUME: "Não posso assumir este privilégio agora",
  RECEIVED_BY_MISTAKE: "Recebi por engano",
};
