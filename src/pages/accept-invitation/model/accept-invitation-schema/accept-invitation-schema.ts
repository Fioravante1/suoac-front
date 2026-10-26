import { z } from "zod";

/*
 * Importado do modulo, nao do barril `@/shared/lib`: este schema entra no grafo
 * do servidor pela Server Action, e o barril reexporta hooks `"use client"` —
 * o build falha ao ver hook de cliente alcancado por Server Component.
 */
import { newPasswordSchema } from "@/shared/lib/password-policy";

/** Digitos de um celular com DDD, com e sem o nono digito — o mesmo recorte do autocadastro. */
const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 11;

function countDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

function hasSurname(value: string): boolean {
  return value.trim().split(/\s+/).length >= 2;
}

/** Nome e sobrenome: o convite chega com o nome que o coordenador do circuito digitou, e a pessoa o confirma. */
const nameSchema = z
  .string()
  .trim()
  .min(2, "Informe seu nome completo.")
  .max(150, "O nome pode ter até 150 caracteres.")
  .refine(hasSurname, "Informe nome e sobrenome.");

/**
 * Validado por contagem de digitos, nao por formato: o campo e exibido com
 * mascara e o mesmo celular digitado com ou sem ela precisa ser aceito. A API
 * recebe so os digitos.
 */
const phoneSchema = z
  .string()
  .refine((value) => countDigits(value) >= PHONE_MIN_DIGITS, "Informe o DDD e o número completo.")
  .refine((value) => countDigits(value) <= PHONE_MAX_DIGITS, "O celular tem no máximo 11 dígitos.");

/** Etapa 1: os dados que o convidado confirma. */
export const acceptInvitationDetailsSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
});

/** O que a Server Action recebe: o que o back exige no aceite (SUC-67). */
export const acceptInvitationPayloadSchema = acceptInvitationDetailsSchema.extend({
  password: newPasswordSchema,
  /** Sem aceite nao ha o que enviar: a versao dos termos so acompanha um aceite de fato. */
  acceptedTerms: z.literal(true),
});

export type AcceptInvitationPayload = z.infer<typeof acceptInvitationPayloadSchema>;

/**
 * O formulario inteiro, das duas etapas. A confirmacao so existe na tela. Os
 * termos viram `acceptedTerms` na Server Action, que envia a versao em vigor.
 */
export const acceptInvitationSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Confirme a senha."),
    terms: z.boolean().refine((accepted) => accepted, "Aceite os termos para continuar."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type AcceptInvitationFormValues = z.infer<typeof acceptInvitationSchema>;

/** Campos da etapa 1, validados antes de avancar para a senha. */
export const DETAILS_STEP_FIELDS = ["name", "phone"] as const;
