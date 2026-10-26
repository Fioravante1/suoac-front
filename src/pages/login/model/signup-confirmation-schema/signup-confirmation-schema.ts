import { z } from "zod";

/** Quantidade de dígitos do código de confirmação enviado por e-mail. */
export const CIRCUIT_SIGNUP_CODE_LENGTH = 6;

/**
 * Validade do código e do rascunho de autocadastro, em minutos.
 *
 * Espelha `CIRCUIT_SIGNUP.CODE_TTL_MS` (`30 * 60_000`) do backend (SUC-37).
 */
export const CIRCUIT_SIGNUP_CODE_TTL_MINUTES = 30;

/**
 * Intervalo mínimo, em segundos, antes de liberar um novo pedido de código.
 *
 * Protege o limite por e-mail (`POST /auth/circuit-signups`) contra cliques
 * repetidos enquanto o e-mail ainda está a caminho.
 */
export const CIRCUIT_SIGNUP_RESEND_COOLDOWN_SECONDS = 60;

export const signupConfirmationSchema = z.object({
  email: z.email("Informe um e-mail válido.").max(255, "O e-mail pode ter até 255 caracteres."),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Digite os 6 dígitos do código."),
});

export type SignupConfirmationValues = z.infer<typeof signupConfirmationSchema>;

/** Extrai apenas os dígitos numéricos (até 6) de um texto digitado ou colado. */
export function extractCodeDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, CIRCUIT_SIGNUP_CODE_LENGTH);
}

/** Formata os segundos restantes do reenvio como `M:SS` (ex.: `1:00`, `0:45`). */
export function formatResendCountdown(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clamped / 60);
  const remainingSeconds = String(clamped % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}
