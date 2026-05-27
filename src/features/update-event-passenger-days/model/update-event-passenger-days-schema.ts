import { z } from "zod";

export const updateEventPassengerDaysSchema = z.object({
  dayIds: z.array(z.string()).min(1, "Selecione pelo menos um dia."),
});

export type UpdateEventPassengerDaysFormValues = z.infer<typeof updateEventPassengerDaysSchema>;
