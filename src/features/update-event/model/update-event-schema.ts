import { z } from "zod";

const dateMessage = "Informe uma data válida.";
const currencyRegex = /^\d+(?:[,.]\d{1,2})?$/;

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime());
}

export const updateEventSchema = z.object({
  title: z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(200, "Use no máximo 200 caracteres."),
  ticketPrice: z
    .string()
    .trim()
    .min(1, "Informe o valor da passagem.")
    .regex(currencyRegex, "Use um valor válido com até 2 casas decimais."),
  registrationDeadline: z.string().refine(isValidDate, dateMessage),
  paymentDeadline: z.string().refine(isValidDate, dateMessage),
  venue: z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(200, "Use no máximo 200 caracteres."),
  address: z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(300, "Use no máximo 300 caracteres."),
  city: z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(100, "Use no máximo 100 caracteres."),
  state: z
    .string()
    .trim()
    .length(2, "Use a sigla com 2 letras.")
    .regex(/^[A-Za-z]{2}$/, "Use apenas letras."),
  observations: z.string().trim().optional(),
});

export type UpdateEventFormValues = z.infer<typeof updateEventSchema>;
