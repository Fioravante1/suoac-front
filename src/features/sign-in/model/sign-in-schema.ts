import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Por favor, insira um e-mail válido."),
  password: z.string().min(6, "A senha deve conter no mínimo 6 caracteres."),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
