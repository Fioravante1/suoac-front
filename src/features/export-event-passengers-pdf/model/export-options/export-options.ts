import type { ExportVariant } from "../export-variant";

export interface ExportOptions {
  /** Congregação específica. Vazio/ausente exporta todas (apenas roles de circuito). */
  congregationId?: string;
  /** Variante do PDF (`carrier` inclui RG, restrita a circuito; `boarding` inclui telefone). */
  variant?: ExportVariant;
}

/**
 * Monta a URL same-origin do Route Handler de exportação. Usa `URLSearchParams` e **omite** o
 * `congregationId` vazio (evita 400/UUID inválido no backend). O `variant` é enviado quando
 * presente; se omitido, o backend assume `boarding` (variante sem dado sensível).
 */
export function buildExportPath(eventId: string, options: ExportOptions = {}): string {
  const params = new URLSearchParams();

  if (options.congregationId) {
    params.set("congregationId", options.congregationId);
  }

  if (options.variant) {
    params.set("variant", options.variant);
  }

  const query = params.toString();
  return `/api/events/${eventId}/passengers/export${query ? `?${query}` : ""}`;
}
