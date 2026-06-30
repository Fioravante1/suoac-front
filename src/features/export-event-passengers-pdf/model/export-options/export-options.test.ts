import { describe, it, expect } from "vitest";

import { EXPORT_VARIANTS } from "../export-variant";
import { buildExportPath } from "./export-options";

describe("buildExportPath", () => {
  it("não inclui query quando não há opções", () => {
    expect(buildExportPath("evt-1")).toBe("/api/events/evt-1/passengers/export");
  });

  it("omite congregationId vazio e variant ausente", () => {
    expect(buildExportPath("evt-1", { congregationId: "" })).toBe("/api/events/evt-1/passengers/export");
  });

  it("inclui congregationId quando preenchido", () => {
    expect(buildExportPath("evt-1", { congregationId: "cong-9" })).toBe(
      "/api/events/evt-1/passengers/export?congregationId=cong-9",
    );
  });

  it("inclui variant boarding quando informado", () => {
    expect(buildExportPath("evt-1", { variant: EXPORT_VARIANTS.BOARDING })).toBe(
      "/api/events/evt-1/passengers/export?variant=boarding",
    );
  });

  it("inclui variant carrier quando informado", () => {
    expect(buildExportPath("evt-1", { variant: EXPORT_VARIANTS.CARRIER })).toBe(
      "/api/events/evt-1/passengers/export?variant=carrier",
    );
  });

  it("combina congregationId e variant", () => {
    expect(buildExportPath("evt-1", { congregationId: "cong-9", variant: EXPORT_VARIANTS.CARRIER })).toBe(
      "/api/events/evt-1/passengers/export?congregationId=cong-9&variant=carrier",
    );
  });
});
