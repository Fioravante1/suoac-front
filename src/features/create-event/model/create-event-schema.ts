import { z } from "zod";

const dateMessage = "Informe uma data válida.";
const timeMessage = "Informe um horário no formato HH:mm.";
const currencyRegex = /^\d+(?:[,.]\d{1,2})?$/;
const timeRegex = /^\d{2}:\d{2}$/;

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime());
}

export const createEventSchema = z
  .object({
    title: z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(200, "Use no máximo 200 caracteres."),
    type: z.enum(["ASSEMBLY", "REGIONAL_CONVENTION"], { error: "Selecione o tipo de evento." }),
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
    date: z.string().refine(isValidDate, dateMessage),
    endDate: z.string().optional(),
    departureTime: z.string().regex(timeRegex, timeMessage),
    returnTime: z.string().regex(timeRegex, timeMessage),
    observations: z.string().trim().optional(),
  })
  .superRefine((values, context) => {
    if (values.type !== "REGIONAL_CONVENTION") return;

    if (!values.endDate || !isValidDate(values.endDate)) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Informe a data final do congresso.",
      });
      return;
    }

    if (values.endDate < values.date) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "A data final deve ser igual ou posterior à data inicial.",
      });
    }
  });

export type CreateEventFormValues = z.infer<typeof createEventSchema>;

export const createEventDefaultValues: CreateEventFormValues = {
  title: "",
  type: "ASSEMBLY",
  ticketPrice: "",
  registrationDeadline: "",
  paymentDeadline: "",
  venue: "",
  address: "",
  city: "",
  state: "",
  date: "",
  endDate: "",
  departureTime: "06:00",
  returnTime: "18:00",
  observations: "",
};
