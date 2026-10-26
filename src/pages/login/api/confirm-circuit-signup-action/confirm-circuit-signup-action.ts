"use server";

import { endpoints, httpClientRaw } from "@/shared/api/http-client";
import { createSession } from "@/shared/auth/session";

import {
  readSignupConflicts,
  signupConfirmationSchema,
  type SignupConfirmationValues,
  type SignupConflict,
} from "../../model";
import type { SignInResponseDto } from "../sign-in-action/sign-in.dto";

export type ConfirmCircuitSignupInput = SignupConfirmationValues;

export type ConfirmCircuitSignupResult =
  | { status: "success" }
  | { status: "already-confirmed" }
  | { status: "invalid-code"; message: string }
  | { status: "expired-code"; message: string }
  | { status: "conflict"; message: string; conflicts: SignupConflict[] }
  | { status: "error"; message: string };

const GENERIC_ERROR = "Não foi possível confirmar o código agora. Verifique sua conexão e tente novamente.";
const INVALID_CODE_ERROR = "Código inválido. Confira os 6 dígitos enviados para o seu e-mail e tente novamente.";
const EXPIRED_CODE_ERROR =
  'Este código expirou. Clique em "Reenviar código" para receber um novo ou revise os dados do cadastro.';
const RATE_LIMIT_ERROR = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
const CONFLICT_ERROR = "Alguns dados já estão em uso. Confira os campos destacados.";

/**
 * Confirma o autocadastro de circuito com o código de 6 dígitos enviado por e-mail.
 *
 * `POST /auth/circuit-signups/confirmations` consolida o rascunho em transação
 * (circuito, congregações e coordenador) e devolve `{ accessToken, refreshToken, user }`
 * com `201 Created`. A sessão é aberta aqui mesmo, sem exigir login separado, e a
 * função devolve `{ status: "success" }` em vez de redirecionar no servidor —
 * permitindo que o fluxo apresente a etapa final antes de ir ao painel (SUC-33).
 *
 * Cada status de recusa do backend tem destino próprio na tela:
 * - `400`: código incorreto;
 * - `410`: rascunho ou código expirado (30 min ou 5 tentativas erradas);
 * - `409` com `field`/`fields`: conflito de unicidade surgido entre o rascunho e a
 *   consolidação, devolvendo ao campo correspondente;
 * - `409` sem `field`: rascunho já confirmado (ex.: duplo clique), tratado como
 *   já concluído.
 */
export async function confirmCircuitSignupAction(
  input: ConfirmCircuitSignupInput,
): Promise<ConfirmCircuitSignupResult> {
  const parsed = signupConfirmationSchema.safeParse(input);

  if (!parsed.success) {
    return { status: "invalid-code", message: INVALID_CODE_ERROR };
  }

  try {
    const response = await httpClientRaw(endpoints.auth.circuitSignupConfirmations, {
      method: "POST",
      anonymous: true,
      body: parsed.data,
    });

    if (!response.ok) {
      return await toFailure(response);
    }

    const { accessToken, refreshToken, user } = (await response.json()) as SignInResponseDto;

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

    return { status: "success" };
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
}

async function toFailure(response: Response): Promise<ConfirmCircuitSignupResult> {
  if (response.status === 400) return { status: "invalid-code", message: INVALID_CODE_ERROR };
  if (response.status === 410) return { status: "expired-code", message: EXPIRED_CODE_ERROR };
  if (response.status === 429) return { status: "error", message: RATE_LIMIT_ERROR };
  if (response.status !== 409) return { status: "error", message: GENERIC_ERROR };

  const conflicts = readSignupConflicts(await readErrorBody(response));

  if (conflicts.length === 0) {
    return { status: "already-confirmed" };
  }

  return { status: "conflict", message: CONFLICT_ERROR, conflicts };
}

async function readErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
