"use server";

import { endpoints, httpClientRaw } from "@/shared/api/http-client";

import { isDeclineReason, type DeclineReason, type InvitationRejection } from "../../model";
import { readInvitationFailure, rejectionOf } from "../invitation-failure";

export interface DeclineInvitationInput {
  /** Token do link, lido da URL no servidor. Nao e campo do formulario. */
  token: string;
  reason: DeclineReason;
}

export type DeclineInvitationResult =
  /** Recusa gravada: o back avisou quem enviou o convite. */
  | { status: "declined" }
  /** O convite deixou de servir entre abrir a tela e recusar: a tela troca o formulario pelo aviso. */
  | { status: "rejected"; rejection: InvitationRejection }
  /** Falha recuperavel: a pessoa tenta de novo na mesma tela. */
  | { status: "error"; message: string };

const GENERIC_ERROR = "Não foi possível recusar o convite agora. Verifique sua conexão e tente novamente.";
const INVALID_INPUT = "Escolha um dos motivos e tente novamente.";
const RATE_LIMIT_ERROR = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";

/**
 * Recusa o convite.
 *
 * Contrato: `POST /invitations/:token/declines`, corpo `{ reason }` com um dos
 * tres motivos fechados (SUC-68) — `204` sem corpo, ou erro com `code`: `404`,
 * `410`, `409` (usado ou ja recusado) e `403` (revogado). O `409` e ambiguo:
 * so o `code` diz qual dos dois e.
 *
 * Nao reler o convite antes, como o aceite faz: a recusa nao tem nada a
 * mostrar depois, e o back ja responde com o estado verdadeiro. Tambem nao
 * grava cookie nem redireciona — nao ha sessao a abrir, entao o Next nao
 * re-renderiza a rota e a tela confirma a recusa por conta propria.
 */
export async function declineInvitationAction(input: DeclineInvitationInput): Promise<DeclineInvitationResult> {
  // Server Action e rota publica: o tipo so vale em compilacao.
  if (!isDeclineReason(input.reason)) {
    return { status: "error", message: INVALID_INPUT };
  }

  let response: Response;

  try {
    response = await httpClientRaw(endpoints.invitations.declines(input.token), {
      method: "POST",
      anonymous: true,
      body: { reason: input.reason },
    });
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }

  if (response.ok) {
    return { status: "declined" };
  }

  if (response.status === 429) {
    return { status: "error", message: RATE_LIMIT_ERROR };
  }

  const rejection = rejectionOf(await readInvitationFailure(response));

  if (rejection) {
    return { status: "rejected", rejection };
  }

  // `400` sem `code` e motivo fora da lista, que a tela nao deixa escolher;
  // qualquer outro e falha do servico. Nenhum e veredito sobre o link.
  return { status: "error", message: response.status === 400 ? INVALID_INPUT : GENERIC_ERROR };
}
