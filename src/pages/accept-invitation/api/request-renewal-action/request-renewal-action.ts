"use server";

import { INVITATION_ERROR_CODES } from "@/entities/invitation";
import { endpoints, httpClientRaw } from "@/shared/api/http-client";

import type { InvitationRejection } from "../../model";
import { readInvitationFailure, rejectionOf } from "../invitation-failure";

export interface RequestRenewalInput {
  /** Token do link expirado, lido da URL no servidor. */
  token: string;
}

export type RequestRenewalResult =
  /** Pedido registrado, ou ja registrado nas ultimas 24 horas: o back responde igual e avisa uma vez so. */
  | { status: "requested" }
  /** O convite deixou de poder renovar — usado, recusado, cancelado, ou a conta ja existe: a tela troca o aviso. */
  | { status: "rejected"; rejection: InvitationRejection }
  /** Falha recuperavel: a pessoa tenta de novo na mesma tela. */
  | { status: "error"; message: string };

const GENERIC_ERROR = "Não foi possível enviar o pedido agora. Verifique sua conexão e tente novamente.";
const RATE_LIMIT_ERROR = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
const STILL_VALID_ERROR = "Este convite ainda é válido. Recarregue a página para abri-lo.";

/**
 * Pede um novo convite a quem enviou o expirado.
 *
 * Contrato: `POST /invitations/:token/renewal-requests`, sem corpo (SUC-72) —
 * `204`, tambem para o pedido repetido dentro de 24 horas, ou erro com `code`:
 * `404`, `409` (usado, recusado ou e-mail ja cadastrado), `403` (revogado) e
 * `409` `INVITATION_NOT_EXPIRED` (o convite ainda vale). O `409` e ambiguo:
 * so o `code` diz qual e.
 *
 * O back so avisa o coordenador do circuito, que decide se reenvia: a tela nao
 * promete um link novo, promete que o pedido chegou.
 */
export async function requestRenewalAction(input: RequestRenewalInput): Promise<RequestRenewalResult> {
  let response: Response;

  try {
    response = await httpClientRaw(endpoints.invitations.renewalRequests(input.token), {
      method: "POST",
      anonymous: true,
    });
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }

  if (response.ok) {
    return { status: "requested" };
  }

  if (response.status === 429) {
    return { status: "error", message: RATE_LIMIT_ERROR };
  }

  const failure = await readInvitationFailure(response);

  // So ocorre se o relogio do convite e o da tela divergem; recarregar mostra o convite valido.
  if (failure.code === INVITATION_ERROR_CODES.NOT_EXPIRED) {
    return { status: "error", message: STILL_VALID_ERROR };
  }

  const rejection = rejectionOf(failure);

  if (rejection) {
    return { status: "rejected", rejection };
  }

  // Qualquer outro e falha do servico, nao veredito sobre o link.
  return { status: "error", message: GENERIC_ERROR };
}
