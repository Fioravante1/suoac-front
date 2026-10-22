/*
 * `server-only`, nao `"use server"`: o unico chamador e a propria pagina, que e
 * Server Component. Como Server Action, isto viraria mais uma superficie
 * POST alcancavel pelo navegador, sem nenhum ganho — ninguem no cliente chama.
 *
 * Nao se engane sobre o alcance disso: a propria rota ja revela o estado do
 * token, porque `GET /reset-password?token=…` responde com a tela do estado e
 * o guard a deixa passar sem sessao. Quem quiser sondar token nao precisa
 * desta funcao. O que limita a sondagem e o tamanho do token e, se vier a ser
 * preciso, um limite de tentativas no backend — nao a forma deste modulo.
 */
import "server-only";

import { endpoints, httpClient, HttpError } from "@/shared/api/http-client";

import type { TokenState } from "../../model";

/**
 * Descobre o estado do token **sem consumi-lo**, para a tela abrir ja sabendo o
 * que mostrar.
 *
 * Existe um endpoint separado para isto no contrato (SUC-35) por um motivo de
 * uso: sem ele, quem chega com link expirado digitaria a senha nova duas vezes
 * antes de descobrir que o link morreu.
 *
 * Contrato: `POST /auth/password-reset-verifications`, corpo `{ token }` —
 * `204` valido, `400` invalido, `410` expirado, `409` ja utilizado.
 */
export async function verifyResetTokenAction(token: string): Promise<TokenState> {
  if (!token) {
    return "invalid";
  }

  try {
    await httpClient<void>(endpoints.auth.passwordResetVerifications, {
      method: "POST",
      body: { token },
      /*
       * O endpoint e publico e esta funcao roda em render de Server Component,
       * onde escrever cookie e proibido. Sem `anonymous`, um `401` levaria o
       * cliente a renovar a sessao — e o `ReadonlyRequestCookiesError` que o
       * Next lanca cairia no `catch` abaixo como "unavailable", mandando
       * recarregar a pagina numa falha que nenhum recarregamento resolve,
       * porque o cookie velho continua la. Quem chega por este link pode muito
       * bem estar num navegador com a sessao de outra pessoa — e justamente o
       * caso que motivou liberar a rota no guard.
       */
      anonymous: true,
    });

    return "valid";
  } catch (error) {
    if (!(error instanceof HttpError)) {
      return "unavailable";
    }

    if (error.status === 410) return "expired";
    if (error.status === 409) return "used";
    if (error.status === 400) return "invalid";

    // Qualquer outro status e falha do servico, nao veredito sobre o token:
    // dizer "link invalido" aqui mandaria a pessoa pedir outro link sem motivo.
    return "unavailable";
  }
}
