import { z } from "zod";

export const congregationFormSchema = z.object({
  code: z.string().min(1, { message: "Código é obrigatório." }),
  name: z.string().min(1, { message: "Nome é obrigatório." }),
  email: z.email({ message: "E-mail inválido." }).min(1, { message: "E-mail é obrigatório." }),
  city: z.string().min(1, { message: "Cidade é obrigatória." }),
});

/**
 * A edição de uma congregação cadastrada sem e-mail (como no autocadastro do circuito) aceita o campo
 * vazio, e a página não o envia. Preenchido, ele continua tendo de ser um e-mail válido.
 */
export const congregationEditWithoutEmailSchema = congregationFormSchema.extend({
  email: z.union([z.literal(""), z.email({ message: "E-mail inválido." })]),
});

export type CongregationFormValues = z.infer<typeof congregationFormSchema>;
