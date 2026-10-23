import type { ExpiredInvitationDetails, Invitation } from "@/entities/invitation";

/**
 * Por que o convite nao pode ser aceito, ou a falha que impede de saber. Cada
 * um tem texto e saida propria na tela — o card SUC-27 proibiu colapsar isso
 * num erro generico.
 *
 * `email-registered` so existe no aceite: a consulta nao sabe se o e-mail ja
 * tem conta. Fica aqui, e nao no codigo da API, porque a tela trata igual.
 */
export const INVITATION_NOTICE_STATES = [
  "expired",
  "used",
  "revoked",
  "not-found",
  "email-registered",
  "unavailable",
] as const;

export type InvitationNoticeState = (typeof INVITATION_NOTICE_STATES)[number];

export interface InvitationRejection {
  state: InvitationNoticeState;
  /** Contexto do `410`; `null` nos demais estados e quando o back nao o enviou. */
  details: ExpiredInvitationDetails | null;
}

export type InvitationLookup =
  | { status: "pending"; invitation: Invitation }
  | { status: "rejected"; rejection: InvitationRejection };
