import { z } from "zod";

export const congregationFormSchema = z.object({
  code: z.string().min(1, { message: "Código é obrigatório." }),
  name: z.string().min(1, { message: "Nome é obrigatório." }),
  email: z.email({ message: "E-mail inválido." }).min(1, { message: "E-mail é obrigatório." }),
  city: z.string().min(1, { message: "Cidade é obrigatória." }),
});

export type CongregationFormValues = z.infer<typeof congregationFormSchema>;
