/**
 * Papel que um convite concede: so o coordenador da congregacao. O assistente
 * nao entra por convite — e promovido pelo proprio coordenador da congregacao
 * —, e convite nunca concede papel de circuito.
 */
export const INVITATION_ROLES = {
  CONGREGATION_COORDINATOR: "CONGREGATION_COORDINATOR",
} as const;

export type InvitationRole = (typeof INVITATION_ROLES)[keyof typeof INVITATION_ROLES];

export const INVITATION_ROLE_LABELS: Record<InvitationRole, string> = {
  CONGREGATION_COORDINATOR: "Coordenador do arranjo de ônibus na congregação",
};

/** Rotulo curto, para resumos onde o nome inteiro do privilegio nao cabe. */
export const INVITATION_ROLE_SHORT_LABELS: Record<InvitationRole, string> = {
  CONGREGATION_COORDINATOR: "Coordenador na congregação",
};

export function isInvitationRole(value: string): value is InvitationRole {
  return Object.hasOwn(INVITATION_ROLES, value);
}

/**
 * Codigo de maquina que acompanha cada recusa do convite (SUC-36 e SUC-68). O front
 * distingue os estados por ele, e nao pelo texto da mensagem: o `409` sozinho
 * quer dizer "ja usado" na consulta e tambem "e-mail ja cadastrado" no aceite.
 */
export const INVITATION_ERROR_CODES = {
  NOT_FOUND: "INVITATION_NOT_FOUND",
  EXPIRED: "INVITATION_EXPIRED",
  USED: "INVITATION_USED",
  REVOKED: "INVITATION_REVOKED",
  DECLINED: "INVITATION_DECLINED",
  EMAIL_ALREADY_REGISTERED: "INVITATION_EMAIL_ALREADY_REGISTERED",
} as const;

export type InvitationErrorCode = (typeof INVITATION_ERROR_CODES)[keyof typeof INVITATION_ERROR_CODES];

/**
 * Convite como a tela de aceite o enxerga: o minimo que o convidado precisa
 * para reconhecer quem convidou e onde vai entrar (`GET /invitations/:token`,
 * SUC-36 e SUC-67). Datas chegam como ISO 8601.
 */
export interface Invitation {
  name: string;
  email: string;
  /** So digitos, ou `null` quando o coordenador do circuito nao informou. */
  phone: string | null;
  role: string;
  invitedBy: string;
  circuit: string;
  circuitCity: string;
  circuitState: string;
  congregation: string;
  congregationCode: string;
  expiresAt: string;
}

/**
 * Contexto que o `410` do convite expirado carrega: a tela mostra para quem o
 * convite foi enviado, por quem e quando valeu.
 */
export interface ExpiredInvitationDetails {
  email: string;
  invitedBy: string;
  sentAt: string;
  expiresAt: string;
}
