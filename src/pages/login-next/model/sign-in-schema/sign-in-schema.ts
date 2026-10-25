import { z } from "zod";

/**
 * Entrada no sistema.
 *
 * O mesmo schema valida no cliente, enquanto o usuario digita, e no servidor,
 * antes de tocar a API — dado vindo do navegador nunca e confiavel, nem quando
 * a propria tela o validou.
 */
export const signInSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
  /** "Manter conectado neste computador": pede a sessão estendida ao backend (SUC-39). */
  rememberMe: z.boolean(),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
