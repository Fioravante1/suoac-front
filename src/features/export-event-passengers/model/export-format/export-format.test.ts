import { describe, it, expect } from "vitest";

import {
  EXPORT_FORMATS,
  EXPORT_FORMAT_CONTENT_TYPES,
  EXPORT_FORMAT_LABELS,
  parseExportFormat,
  type ExportFormat,
} from "./export-format";

describe("EXPORT_FORMATS", () => {
  it("expõe os dois formatos do contrato (pdf e xlsx)", () => {
    expect(EXPORT_FORMATS).toEqual({ PDF: "pdf", XLSX: "xlsx" });
  });

  it("tem label e content-type para cada formato", () => {
    const formats: ExportFormat[] = [EXPORT_FORMATS.PDF, EXPORT_FORMATS.XLSX];

    for (const format of formats) {
      expect(EXPORT_FORMAT_LABELS[format]).toBeTruthy();
      expect(EXPORT_FORMAT_CONTENT_TYPES[format]).toBeTruthy();
    }
  });

  it("usa o content-type oficial de planilha para xlsx", () => {
    expect(EXPORT_FORMAT_CONTENT_TYPES[EXPORT_FORMATS.XLSX]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  });
});

describe("parseExportFormat", () => {
  it("assume pdf quando o valor está ausente (null ou vazio)", () => {
    expect(parseExportFormat(null)).toBe(EXPORT_FORMATS.PDF);
    expect(parseExportFormat("")).toBe(EXPORT_FORMATS.PDF);
  });

  it("retorna o próprio formato quando válido", () => {
    expect(parseExportFormat("pdf")).toBe(EXPORT_FORMATS.PDF);
    expect(parseExportFormat("xlsx")).toBe(EXPORT_FORMATS.XLSX);
  });

  it("retorna null para formato inválido", () => {
    expect(parseExportFormat("csv")).toBeNull();
    expect(parseExportFormat("PDF")).toBeNull();
    expect(parseExportFormat("doc")).toBeNull();
  });
});
