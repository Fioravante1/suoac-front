import { z } from "zod";

/*
 * Importado do modulo, nao do barril `@/shared/lib`: este schema e usado pela
 * Server Action, e o barril reexporta hooks `"use client"` (`useServerError`,
 * `useModal`, `usePagination`) — o build falha ao ver hook de cliente alcancado
 * pelo grafo do servidor. Mesmo motivo do schema da redefinicao por link.
 */
import { PASSWORD_MAX_LENGTH, PASSWORD_MAX_LENGTH_MESSAGE, newPasswordSchema } from "@/shared/lib/password-policy";

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Informe sua senha atual.")
      .max(PASSWORD_MAX_LENGTH, PASSWORD_MAX_LENGTH_MESSAGE),
    /*
     * A politica vem de `shared/lib`, que espelha o `PASSWORD_COMPLEXITY_REGEX`
     * do backend. Validar menos aqui e o defeito do SUC-59: `senhalonga`
     * passava, a requisicao saia e o servidor respondia `400` — depois de a
     * pessoa digitar a senha duas vezes, no primeiro acesso dela ao sistema.
     */
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "A nova senha deve ser diferente da atual.",
    path: ["newPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
