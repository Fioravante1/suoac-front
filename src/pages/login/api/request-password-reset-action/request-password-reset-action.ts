"use server";

import { endpoints, httpClient, HttpError } from "@/shared/api/http-client";

import { passwordResetRequestSchema } from "../../model";

export interface RequestPasswordResetInput {
  email: string;
}

export type RequestPasswordResetResult = { status: "success" } | { status: "error"; message: string };

const GENERIC_ERROR = "Não foi possível enviar o link agora. Verifique sua conexão e tente novamente.";
const RATE_LIMIT_ERROR = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";

/**
 * Solicita o link de recuperacao sem revelar se o e-mail pertence a uma conta.
 *
 * Contrato esperado do backend: `POST /auth/password-reset-requests` aceita
 * e-mails cadastrados ou desconhecidos com a mesma resposta sem dados. Assim,
 * tempo, status e texto da tela nao servem para enumerar usuarios do sistema.
 */
export async function requestPasswordResetAction(
  input: RequestPasswordResetInput,
): Promise<RequestPasswordResetResult> {
  const parsed = passwordResetRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { status: "error", message: "Informe um e-mail válido." };
  }

  try {
    await httpClient<void>(endpoints.auth.passwordResetRequests, {
      method: "POST",
      body: parsed.data,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof HttpError && error.status === 429) {
      return { status: "error", message: RATE_LIMIT_ERROR };
    }

    return { status: "error", message: GENERIC_ERROR };
  }
}
