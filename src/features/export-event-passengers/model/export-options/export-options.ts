import { EXPORT_FORMATS, type ExportFormat } from "../export-format";
import type { ExportVariant } from "../export-variant";

export interface ExportOptions {
  /** Congregação específica. Vazio/ausente exporta todas (apenas roles de circuito). */
  congregationId?: string;
  /** Variante da lista (`carrier` inclui RG, restrita a circuito; `boarding` inclui telefone). */
  variant?: ExportVariant;
  /** Formato do arquivo. Opcional na entrada; sempre materializado como `pdf` na URL quando ausente. */
  format?: ExportFormat;
}

/**
 * Monta a URL same-origin do Route Handler de exportação. Usa `URLSearchParams` e **omite** o
 * `congregationId` vazio (evita 400/UUID inválido no backend). O `variant` é enviado quando presente;
 * se omitido, o backend assume `boarding` (variante sem dado sensível). O `format` é **sempre**
 * incluído (default `pdf`), deixando a escolha explícita na URL.
 */
export function buildExportPath(eventId: string, options: ExportOptions = {}): string {
  const params = new URLSearchParams();

  if (options.congregationId) {
    params.set("congregationId", options.congregationId);
  }

  if (options.variant) {
    params.set("variant", options.variant);
  }

  params.set("format", options.format ?? EXPORT_FORMATS.PDF);

  return `/api/events/${eventId}/passengers/export?${params.toString()}`;
}
