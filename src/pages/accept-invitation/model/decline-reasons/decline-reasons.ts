/**
 * Motivos de recusa do desenho, com os valores que o back aceita em
 * `POST /invitations/:token/declines` (SUC-68). A ordem e a da tela.
 */
export const DECLINE_REASONS = {
  NOT_THE_PERSON: "NOT_THE_PERSON",
  CANNOT_ASSUME_NOW: "CANNOT_ASSUME_NOW",
  RECEIVED_BY_MISTAKE: "RECEIVED_BY_MISTAKE",
} as const;

export type DeclineReason = (typeof DECLINE_REASONS)[keyof typeof DECLINE_REASONS];

export const DECLINE_REASON_LABELS: Record<DeclineReason, string> = {
  NOT_THE_PERSON: "Não sou a pessoa indicada",
  CANNOT_ASSUME_NOW: "Não posso assumir este privilégio agora",
  RECEIVED_BY_MISTAKE: "Recebi por engano",
};

export function isDeclineReason(value: unknown): value is DeclineReason {
  return typeof value === "string" && Object.hasOwn(DECLINE_REASONS, value);
}
