/**
 * Formatos de exportação da listagem de inscritos. O endpoint do backend é o mesmo do PDF, mudando
 * apenas o sufixo (`export.pdf` / `export.xlsx`) e o Content-Type. `EXPORT_FORMATS` é a fonte única de
 * verdade do domínio; a UI usa os labels e o proxy server-side usa os content-types e o parser.
 */
export const EXPORT_FORMATS = {
  PDF: "pdf",
  XLSX: "xlsx",
} as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[keyof typeof EXPORT_FORMATS];

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  [EXPORT_FORMATS.PDF]: "PDF",
  [EXPORT_FORMATS.XLSX]: "Excel",
};

/** Content-Type esperado por formato (usado no fallback do proxy server-side). */
export const EXPORT_FORMAT_CONTENT_TYPES: Record<ExportFormat, string> = {
  [EXPORT_FORMATS.PDF]: "application/pdf",
  [EXPORT_FORMATS.XLSX]: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/**
 * Valida o `format` cru vindo da query do Route Handler:
 * - ausente (`null`/`""`) → default `pdf`;
 * - `"pdf"` | `"xlsx"` → o próprio formato;
 * - qualquer outro valor → `null` (inválido → o proxy responde 400).
 */
export function parseExportFormat(value: string | null): ExportFormat | null {
  if (value === null || value === "") return EXPORT_FORMATS.PDF;
  if (value === EXPORT_FORMATS.PDF || value === EXPORT_FORMATS.XLSX) return value;
  return null;
}
