import type { Path } from "react-hook-form";

import type { SignupFormValues } from "../signup-schema";

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
