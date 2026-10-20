import { z } from "zod";

/*
 * Importado do modulo, nao do barril `@/shared/lib`: este schema entra no grafo
 * do servidor pela Server Action, e o barril reexporta hooks `"use client"`
 * (`useServerError`, `useModal`, `usePagination`) — o build falha ao ver hook de
 * cliente alcancado por Server Component.
 */
import { newPasswordSchema } from "@/shared/lib/password-policy";

/**
 * Senha nova e confirmacao da tela de redefinicao.
 *
 * O token nao entra aqui: ele vem da URL e nao e campo de formulario — a tela o
 * repassa a action, que o envia no corpo da requisicao.
 */
export const resetPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
