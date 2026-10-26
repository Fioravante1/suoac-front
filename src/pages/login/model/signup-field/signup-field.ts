import type { Path } from "react-hook-form";

import type { SignupFormValues } from "../signup-schema";

/** Conflito apontado pela API: o caminho do campo e a mensagem para a tela. */
export interface SignupConflict {
  field: string;
  message: string;
}

interface ConflictBody {
  message?: unknown;
  field?: unknown;
  fields?: unknown;
}

/**
 * Campos do formulário de autocadastro que a API sabe apontar em um conflito.
 *
 * O `field` da resposta (`409`/`422`) usa o mesmo caminho do formulário, com o
 * índice da linha nas congregações. Só o que casa aqui vira erro de campo; o
 * resto — por exemplo `congregations` sem índice, que a API devolve na
 * consolidação — não tem onde ser pintado e vai como erro geral.
 */
const SIGNUP_FIELD_PATTERN =
  /^(?:coordinator\.(?:name|email|phone|password)|circuit\.(?:name|city|state)|congregations\.\d+\.(?:name|code))$/;

/** Etapa (índice base zero) que contém cada grupo de campos. */
const STEP_BY_GROUP = { coordinator: 0, circuit: 1, congregations: 2 } as const;

export function isSignupFieldPath(field: string): field is Path<SignupFormValues> {
  return SIGNUP_FIELD_PATTERN.test(field);
}

/** Índice da etapa que contém o campo, ou `null` quando o caminho não é de um campo. */
export function resolveSignupFieldStep(field: string): number | null {
  if (!isSignupFieldPath(field)) return null;

  const group = field.split(".")[0] as keyof typeof STEP_BY_GROUP;

  return STEP_BY_GROUP[group];
}

/**
 * Extrai a lista de conflitos do corpo de erro (`409` ou `422`) da API.
 *
 * A API manda a lista completa em `fields` (`409` da criação do rascunho) e só
 * o primeiro em `field` (`422`, e o `409` de colisão na consolidação). A lista
 * tem precedência; `field` com `message` é o plano B.
 */
export function readSignupConflicts(body: unknown): SignupConflict[] {
  if (typeof body !== "object" || body === null) return [];

  const candidate = body as ConflictBody;

  if (Array.isArray(candidate.fields)) {
    return candidate.fields.filter(isSignupConflict);
  }

  if (typeof candidate.field === "string" && typeof candidate.message === "string") {
    return [{ field: candidate.field, message: candidate.message }];
  }

  return [];
}

function isSignupConflict(value: unknown): value is SignupConflict {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<SignupConflict>;

  return typeof candidate.field === "string" && typeof candidate.message === "string";
}
