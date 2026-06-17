export interface ExportOptions {
  /** Congregação específica. Vazio/ausente exporta todas (apenas roles de circuito). */
  congregationId?: string;
  /** Inclui a coluna RG no PDF (apenas roles de circuito). */
  includeSensitive?: boolean;
}

/**
 * Monta a URL same-origin do Route Handler de exportação. Usa `URLSearchParams` e **omite** params
 * vazios/`false` para não enviar `congregationId` vazio ou `includeSensitive=false` (evita 400/UUID
 * inválido no backend).
 */
export function buildExportPath(eventId: string, options: ExportOptions = {}): string {
  const params = new URLSearchParams();

  if (options.congregationId) {
    params.set("congregationId", options.congregationId);
  }

  if (options.includeSensitive) {
    params.set("includeSensitive", "true");
  }

  const query = params.toString();
  return `/api/events/${eventId}/passengers/export${query ? `?${query}` : ""}`;
}
