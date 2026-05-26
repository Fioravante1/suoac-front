import { z } from "zod";

const rgRegex = /^[\d.\-xX]{5,14}$/;

function optionalTextField(max: number, message: string) {
  return z.string().trim().max(max, { message }).optional();
}

export const passengerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Nome deve ter pelo menos 2 caracteres." })
    .max(200, { message: "Nome deve ter no máximo 200 caracteres." }),
  rg: z.string().trim().regex(rgRegex, { message: "RG deve conter 5 a 14 caracteres: dígitos, pontos, hífens ou X." }),
  phone: optionalTextField(20, "Telefone deve ter no máximo 20 caracteres.").refine(
    (value) => !value || value.length === 0 || value.length >= 8,
    { message: "Telefone deve ter pelo menos 8 caracteres." },
  ),
  observations: optionalTextField(500, "Observações devem ter no máximo 500 caracteres."),
});

export type PassengerFormValues = z.infer<typeof passengerFormSchema>;
