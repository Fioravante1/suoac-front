import { describe, it, expect } from "vitest";

import { buildExportPath } from "./export-options";

describe("buildExportPath", () => {
  it("não inclui query quando não há opções", () => {
    expect(buildExportPath("evt-1")).toBe("/api/events/evt-1/passengers/export");
  });

  it("omite congregationId vazio e includeSensitive false", () => {
    expect(buildExportPath("evt-1", { congregationId: "", includeSensitive: false })).toBe(
      "/api/events/evt-1/passengers/export",
    );
  });

  it("inclui congregationId quando preenchido", () => {
    expect(buildExportPath("evt-1", { congregationId: "cong-9" })).toBe(
      "/api/events/evt-1/passengers/export?congregationId=cong-9",
    );
  });

  it("inclui includeSensitive apenas quando true", () => {
    expect(buildExportPath("evt-1", { includeSensitive: true })).toBe(
      "/api/events/evt-1/passengers/export?includeSensitive=true",
    );
  });

  it("combina congregationId e includeSensitive", () => {
    expect(buildExportPath("evt-1", { congregationId: "cong-9", includeSensitive: true })).toBe(
      "/api/events/evt-1/passengers/export?congregationId=cong-9&includeSensitive=true",
    );
  });
});
