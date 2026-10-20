/*
 * `server-only`, nao `"use server"`: o unico chamador e a propria pagina, que e
 * Server Component. Como Server Action, isto viraria um endpoint POST publico e
 * sem limite de tentativas, consultavel pelo navegador — um oraculo gratuito
 * para sondar tokens contra uma API que talvez nem seja alcancavel de fora.
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
