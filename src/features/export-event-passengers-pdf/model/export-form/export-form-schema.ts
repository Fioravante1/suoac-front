import { z } from "zod";

export const exportFormSchema = z.object({
  congregationId: z.string(),
});

export type ExportFormValues = z.infer<typeof exportFormSchema>;

export const exportFormDefaultValues: ExportFormValues = {
  congregationId: "",
};
