import { z } from "zod";

/** E-mail usado para solicitar um link de recuperacao de senha. */
export const passwordResetRequestSchema = z.object({
  email: z.email("Informe um e-mail válido."),
});

export type PasswordResetRequestFormValues = z.infer<typeof passwordResetRequestSchema>;
