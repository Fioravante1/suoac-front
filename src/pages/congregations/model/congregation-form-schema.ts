import { z } from "zod";

export const congregationFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  city: z.string().optional(),
});

export type CongregationFormValues = z.infer<typeof congregationFormSchema>;
