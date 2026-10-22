"use server";

import { endpoints, httpClientRaw } from "@/shared/api/http-client";
import { phoneDigits } from "@/shared/lib/phone";

import { readSignupConflicts, signupSchema, type SignupConflict, type SignupFormValues } from "../../model";

export type { SignupConflict } from "../../model";

export type SubmitCircuitSignupResult =
  | { status: "success"; email: string }
  | { status: "error"; message: string; conflicts: SignupConflict[] };

const GENERIC_ERROR = "Não foi possível criar o circuito agora. Verifique sua conexão e tente novamente.";
const INVALID_DATA_ERROR = "Alguns dados estão inválidos. Confira as etapas e tente novamente.";
const RATE_LIMIT_ERROR = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
const CONFLICT_ERROR = "Alguns dados já estão em uso. Confira os campos destacados.";

/**
 * Envia o autocadastro inteiro, ao concluir a etapa 3.
 *
 * `POST /auth/circuit-signups` responde `202` **sem corpo** e não cria nada: guarda
 * um rascunho e dispara o código de confirmação por e-mail. Por isso usa
 * `httpClientRaw` — `httpClient` só trata `204` como vazio e quebraria ao ler o
 * JSON de um `202` — e `anonymous`, já que quem se cadastra ainda não tem sessão.
 *
 * O payload sai do schema, não do formulário cru: é ele que deixa circuito, UF e
 * código em maiúsculas, como a API persiste. Celular segue só com dígitos e o
 * aceite dos termos, que é só consentimento da tela, não vai.
 *
 * Os conflitos (`409`) e a recusa de código repetido (`422`) voltam em
 * `conflicts`, com o caminho do campo, para a tela pintar cada erro no lugar certo.
 */
export async function submitCircuitSignupAction(input: SignupFormValues): Promise<SubmitCircuitSignupResult> {
  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return failure(INVALID_DATA_ERROR);
  }

  const { coordinator, circuit, congregations } = parsed.data;

  try {
    const response = await httpClientRaw(endpoints.auth.circuitSignups, {
      method: "POST",
      anonymous: true,
      body: { coordinator: { ...coordinator, phone: phoneDigits(coordinator.phone) }, circuit, congregations },
    });

    if (response.ok) {
      return { status: "success", email: coordinator.email };
    }

    return await toFailure(response);
  } catch {
    return failure(GENERIC_ERROR);
  }
}

function failure(message: string, conflicts: SignupConflict[] = []): SubmitCircuitSignupResult {
  return { status: "error", message, conflicts };
}

async function toFailure(response: Response): Promise<SubmitCircuitSignupResult> {
  if (response.status === 429) return failure(RATE_LIMIT_ERROR);
  if (response.status === 400) return failure(INVALID_DATA_ERROR);
  if (response.status !== 409 && response.status !== 422) return failure(GENERIC_ERROR);

  const conflicts = readSignupConflicts(await readErrorBody(response));

  if (conflicts.length === 0) return failure(GENERIC_ERROR);

  return failure(CONFLICT_ERROR, conflicts);
}

async function readErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
