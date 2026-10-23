"use server";

import { redirect } from "next/navigation";

import type { Invitation } from "@/entities/invitation";
import { endpoints, httpClientRaw } from "@/shared/api/http-client";
import { createSession } from "@/shared/auth/session";
import { routes } from "@/shared/config";

import { acceptInvitationPayloadSchema, type InvitationRejection } from "../../model";
import { readInvitationFailure, rejectionOf } from "../invitation-failure";
import { loadInvitation } from "../load-invitation-action";
import { saveWelcomeSummary } from "../welcome-cookie";

export interface AcceptInvitationInput {
  /** Token do link, lido da URL no servidor. Nao e campo do formulario. */
  token: string;
  name: string;
  phone: string;
  password: string;
}

/**
 * O sucesso nao aparece aqui: ele termina em `redirect`, e a funcao nao retorna.
 */
export type AcceptInvitationResult =
  /** O convite deixou de servir entre abrir a tela e enviar: a tela troca o formulario pelo aviso. */
  | { status: "rejected"; rejection: InvitationRejection }
  /** Falha recuperavel: a pessoa corrige ou tenta de novo no mesmo formulario. */
  | { status: "error"; message: string };

const GENERIC_ERROR = "Não foi possível concluir o cadastro agora. Verifique sua conexão e tente novamente.";
const INVALID_INPUT = "Revise os dados e a senha e tente novamente.";
const RATE_LIMIT_ERROR = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
const NO_SESSION_ERROR =
  "Seu cadastro foi concluído, mas não conseguimos abrir o acesso agora. Entre pela tela de entrada com o seu e-mail e a senha que você criou.";

/** Mesma rota, sem token: o convite foi consumido e a URL nao deve carrega-lo. */
const WELCOME_URL = `${routes.acceptInvitation}?status=bem-vindo`;

interface AcceptResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "CIRCUIT_COORDINATOR" | "CIRCUIT_ASSISTANT" | "CONGREGATION_COORDINATOR" | "CONGREGATION_ASSISTANT";
    isActive: boolean;
    circuitId: string;
    congregationId: string | null;
    mustChangePassword?: boolean;
  };
}

/**
 * Aceita o convite: cria o usuario com os dados confirmados e a senha, abre a
 * sessao e leva a tela de boas-vindas.
 *
 * Contrato: `POST /invitations/:token/acceptances`, corpo
 * `{ name, phone, password }` (todos obrigatorios, SUC-67) — `201` com
 * `{ accessToken, refreshToken, user }`, ou erro com `code`: `404`, `410`,
 * `409` (usado), `403` (revogado) e `409` `INVITATION_EMAIL_ALREADY_REGISTERED`.
 * O `409` e ambiguo: so o `code` diz qual dos dois e.
 *
 * O convite e relido antes do envio por dois motivos. Um e dizer o estado
 * verdadeiro quando ele mudou desde que a tela abriu, sem depender de como o
 * back responde a um corpo valido para um convite morto. O outro e que o
 * aceite consome o token: a tela de boas-vindas so tem o cartao do convite
 * porque ele foi lido antes.
 *
 * Termina em `redirect`, e nao devolvendo `success` para a tela guardar em
 * estado. Escrever o cookie de sessao numa Server Action faz o Next
 * re-renderizar a rota junto da resposta; essa re-renderizacao consultaria o
 * token ja consumido, que responde `409`, e trocaria a confirmacao por
 * "convite ja usado" na cara de quem acabou de aceitar. O `redirect` corta esse
 * caminho — e tira o token da URL e do historico. Ver `welcome-cookie`.
 */
export async function acceptInvitationAction(input: AcceptInvitationInput): Promise<AcceptInvitationResult> {
  const parsed = acceptInvitationPayloadSchema.safeParse({
    name: input.name,
    phone: input.phone,
    password: input.password,
  });

  if (!parsed.success) {
    return { status: "error", message: INVALID_INPUT };
  }

  const lookup = await loadInvitation(input.token);

  if (lookup.status === "rejected") {
    /*
     * Falha do servico na releitura nao e veredito sobre o convite: trocar o
     * formulario por um aviso faria a pessoa perder o que digitou por uma
     * oscilacao que o proximo envio provavelmente nao repete. So os vereditos
     * definitivos — usado, expirado, cancelado — trocam a tela.
     */
    if (lookup.rejection.state === "unavailable") {
      return { status: "error", message: GENERIC_ERROR };
    }

    return lookup;
  }

  const response = await postAcceptance(input.token, parsed.data);

  if ("status" in response) {
    return response;
  }

  /*
   * Fora do `try` de cada etapa: `redirect` sinaliza por excecao, e um `catch`
   * em volta a engoliria, transformando sucesso em erro generico.
   */
  try {
    await openSession(response);
  } catch {
    return { status: "error", message: NO_SESSION_ERROR };
  }

  try {
    await saveWelcomeSummary(toWelcomeSummary(lookup.invitation, response.user.name, response.user.email));
  } catch {
    // A sessao ja esta aberta e a conta existe: sem o resumo, a pagina de
    // boas-vindas leva quem tem sessao ao painel. Falhar aqui deixaria a pessoa
    // diante de um erro falso, e reenviar so resultaria em "convite ja usado".
  }

  redirect(WELCOME_URL);
}

async function postAcceptance(
  token: string,
  payload: { name: string; phone: string; password: string },
): Promise<AcceptResponseDto | AcceptInvitationResult> {
  let response: Response;

  try {
    response = await httpClientRaw(endpoints.invitations.acceptances(token), {
      method: "POST",
      anonymous: true,
      body: { name: payload.name, phone: payload.phone.replace(/\D/g, ""), password: payload.password },
    });
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }

  if (response.ok) {
    return readAcceptance(response);
  }

  if (response.status === 429) {
    return { status: "error", message: RATE_LIMIT_ERROR };
  }

  const rejection = rejectionOf(await readInvitationFailure(response));

  if (rejection) {
    return { status: "rejected", rejection };
  }

  // `400` sem `code` e validacao do back, que a tela ja fez com as mesmas
  // regras; qualquer outro e falha do servico. Nenhum e veredito sobre o link.
  return { status: "error", message: response.status === 400 ? INVALID_INPUT : GENERIC_ERROR };
}

/**
 * Um `2xx` ja quer dizer conta criada e token consumido. Corpo que nao da para
 * ler nesse ponto — proxy truncando, resposta vazia — nao e erro do envio:
 * mandar a pessoa tentar de novo so a levaria a "convite ja usado".
 */
async function readAcceptance(response: Response): Promise<AcceptResponseDto | AcceptInvitationResult> {
  try {
    const body = (await response.json()) as Partial<AcceptResponseDto> | null;

    if (typeof body?.accessToken === "string" && typeof body.refreshToken === "string" && body.user?.id) {
      return body as AcceptResponseDto;
    }
  } catch {
    // Corpo ilegivel: cai no mesmo caminho do corpo incompleto.
  }

  return { status: "error", message: NO_SESSION_ERROR };
}

async function openSession({ accessToken, refreshToken, user }: AcceptResponseDto): Promise<void> {
  await createSession(accessToken, refreshToken, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    circuitId: user.circuitId,
    congregationId: user.congregationId,
    mustChangePassword: user.mustChangePassword,
  });
}

function toWelcomeSummary(invitation: Invitation, name: string, email: string) {
  return {
    name,
    email,
    role: invitation.role,
    invitedBy: invitation.invitedBy,
    circuit: invitation.circuit,
    circuitCity: invitation.circuitCity,
    circuitState: invitation.circuitState,
    congregation: invitation.congregation,
    congregationCode: invitation.congregationCode,
  };
}
