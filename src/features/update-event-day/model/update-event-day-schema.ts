import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}$/;

export const updateEventDaySchema = z.object({
  departureTime: z.string().regex(timeRegex, "Informe um horário no formato HH:mm."),
  returnTime: z.string().regex(timeRegex, "Informe um horário no formato HH:mm."),
});

export type UpdateEventDayFormValues = z.infer<typeof updateEventDaySchema>;
