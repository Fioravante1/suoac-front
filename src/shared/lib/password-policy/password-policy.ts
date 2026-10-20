/**
 * Politica de senha do SUOAC, espelhando o que a API exige.
 *
 * O backend valida isto em todo DTO de senha — criar usuario, trocar senha e
 * redefinir por link — com `PASSWORD_COMPLEXITY_REGEX`. Senha que passa aqui e
 * reprovada la volta como `400`, e o usuario leva a recusa depois de digitar a
 * senha duas vezes. Por isso as regras moram num lugar so, consumido pelos
 * schemas Zod e pelo medidor de forca.
 */

export const PASSWORD_MIN_LENGTH = 8;

/** Teto do backend; serve para barrar colagem absurda antes da requisicao. */
export const PASSWORD_MAX_LENGTH = 100;

export const PASSWORD_REQUIREMENTS = [
  {
    id: "length",
    label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (v: string) => v.length >= PASSWORD_MIN_LENGTH,
  },
  { id: "lowercase", label: "Uma letra minúscula", test: (v: string) => /[a-z]/.test(v) },
  { id: "uppercase", label: "Uma letra maiúscula", test: (v: string) => /[A-Z]/.test(v) },
  { id: "digit", label: "Um número", test: (v: string) => /\d/.test(v) },
] as const;

/**
 * Senha longa demais e reprovada pela API, mas nao e um "requisito" a cumprir:
 * ninguem precisa ser lembrado de escrever menos de 100 caracteres. Fica fora
 * de `PASSWORD_REQUIREMENTS` — que vira lista na tela — e entra no veredito.
 *
 * O campo tambem limita a digitacao com `maxLength`, para que o medidor nunca
 * chegue a dizer "forte" numa senha que o formulario vai recusar.
 */
export function isWithinMaxLength(value: string): boolean {
  return value.length <= PASSWORD_MAX_LENGTH;
}

export type PasswordRequirementId = (typeof PASSWORD_REQUIREMENTS)[number]["id"];

export const PASSWORD_COMPLEXITY_MESSAGE =
  "A senha deve conter ao menos uma letra maiúscula, uma minúscula e um número.";

export const PASSWORD_MIN_LENGTH_MESSAGE = `A senha deve conter no mínimo ${PASSWORD_MIN_LENGTH} caracteres.`;

export const PASSWORD_MAX_LENGTH_MESSAGE = `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`;

/** Quantos requisitos a senha cumpre — e o numero de barras acesas no medidor. */
export function countMetRequirements(value: string): number {
  return PASSWORD_REQUIREMENTS.filter((requirement) => requirement.test(value)).length;
}

export function isPasswordCompliant(value: string): boolean {
  return isWithinMaxLength(value) && countMetRequirements(value) === PASSWORD_REQUIREMENTS.length;
}
