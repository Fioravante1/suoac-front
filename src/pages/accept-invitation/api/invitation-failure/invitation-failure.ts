import { INVITATION_ERROR_CODES, type ExpiredInvitationDetails } from "@/entities/invitation";

import type { InvitationNoticeState, InvitationRejection } from "../../model";

export interface InvitationFailure {
  /** `code` do corpo do erro, ou `null` quando a resposta nao e uma recusa do convite. */
  code: string | null;
  /** Contexto do `410`; `null` nos demais. */
  details: ExpiredInvitationDetails | null;
}

/* `Map`, e nao objeto: `code` vem da rede, e `"toString"` nao pode passar por codigo conhecido. */
const STATE_BY_CODE = new Map<string, InvitationNoticeState>([
  [INVITATION_ERROR_CODES.NOT_FOUND, "not-found"],
  [INVITATION_ERROR_CODES.EXPIRED, "expired"],
  [INVITATION_ERROR_CODES.USED, "used"],
  [INVITATION_ERROR_CODES.REVOKED, "revoked"],
  [INVITATION_ERROR_CODES.EMAIL_ALREADY_REGISTERED, "email-registered"],
]);

function isExpiredDetails(value: unknown): value is ExpiredInvitationDetails {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return ["email", "invitedBy", "sentAt", "expiresAt"].every((key) => typeof record[key] === "string");
}

/**
 * Le o `code` e o contexto do corpo de uma resposta de erro do convite.
 *
 * O status sozinho nao basta: o `409` e "ja usado" na consulta e tambem "e-mail
 * ja cadastrado" no aceite. Corpo ilegivel nao e erro aqui — vira falha sem
 * veredito, e quem chama decide o que dizer.
 */
export async function readInvitationFailure(response: Response): Promise<InvitationFailure> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    return { code: null, details: null };
  }

  if (typeof body !== "object" || body === null) {
    return { code: null, details: null };
  }

  const { code, invitation } = body as { code?: unknown; invitation?: unknown };

  return {
    code: typeof code === "string" ? code : null,
    details: isExpiredDetails(invitation) ? invitation : null,
  };
}

/**
 * Estado de convite que a falha representa, ou `null` quando o `code` nao e de
 * recusa do convite (limite de tentativas, erro do servico, `400` de validacao).
 *
 * Um `404` sem `code` tambem cai aqui como `null`: e rota inexistente — API sem
 * o recurso, proxy no meio —, nao veredito sobre o link.
 */
export function rejectionOf(failure: InvitationFailure): InvitationRejection | null {
  if (failure.code === null) {
    return null;
  }

  const state = STATE_BY_CODE.get(failure.code);

  if (!state) {
    return null;
  }

  return { state, details: state === "expired" ? failure.details : null };
}
