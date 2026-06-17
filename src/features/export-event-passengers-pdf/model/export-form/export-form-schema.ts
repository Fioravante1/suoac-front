import { z } from "zod";

export const exportFormSchema = z.object({
  congregationId: z.string(),
  includeSensitive: z.boolean(),
});

export type ExportFormValues = z.infer<typeof exportFormSchema>;

export const exportFormDefaultValues: ExportFormValues = {
  congregationId: "",
  includeSensitive: false,
};
