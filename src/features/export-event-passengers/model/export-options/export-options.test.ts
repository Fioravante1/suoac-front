import { describe, it, expect } from "vitest";

import { EXPORT_FORMATS } from "../export-format";
import { EXPORT_VARIANTS } from "../export-variant";
import { buildExportPath } from "./export-options";

describe("buildExportPath", () => {
  it("inclui format=pdf por padrão quando não há opções", () => {
    expect(buildExportPath("evt-1")).toBe("/api/events/evt-1/passengers/export?format=pdf");
  });

  it("omite congregationId vazio e usa format=pdf por padrão", () => {
    expect(buildExportPath("evt-1", { congregationId: "" })).toBe("/api/events/evt-1/passengers/export?format=pdf");
  });

  it("inclui congregationId quando preenchido", () => {
    expect(buildExportPath("evt-1", { congregationId: "cong-9" })).toBe(
      "/api/events/evt-1/passengers/export?congregationId=cong-9&format=pdf",
    );
  });

  it("inclui variant boarding quando informado", () => {
    expect(buildExportPath("evt-1", { variant: EXPORT_VARIANTS.BOARDING })).toBe(
      "/api/events/evt-1/passengers/export?variant=boarding&format=pdf",
    );
  });

  it("inclui variant carrier quando informado", () => {
    expect(buildExportPath("evt-1", { variant: EXPORT_VARIANTS.CARRIER })).toBe(
      "/api/events/evt-1/passengers/export?variant=carrier&format=pdf",
    );
  });

  it("inclui format=xlsx quando informado", () => {
    expect(buildExportPath("evt-1", { format: EXPORT_FORMATS.XLSX })).toBe(
      "/api/events/evt-1/passengers/export?format=xlsx",
    );
  });

  it("combina congregationId, variant e format", () => {
    expect(
      buildExportPath("evt-1", {
        congregationId: "cong-9",
        variant: EXPORT_VARIANTS.CARRIER,
        format: EXPORT_FORMATS.XLSX,
      }),
    ).toBe("/api/events/evt-1/passengers/export?congregationId=cong-9&variant=carrier&format=xlsx");
  });
});
