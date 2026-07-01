import { z } from "zod";

import { EXPORT_FORMATS } from "../export-format";

export const exportFormSchema = z.object({
  congregationId: z.string(),
  format: z.enum([EXPORT_FORMATS.PDF, EXPORT_FORMATS.XLSX]),
});

export type ExportFormValues = z.infer<typeof exportFormSchema>;

export const exportFormDefaultValues: ExportFormValues = {
  congregationId: "",
  format: EXPORT_FORMATS.PDF,
};
