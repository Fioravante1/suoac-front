import { describe, expect, it } from "vitest";

import { formatDate, formatWeekday } from "./date-formatters";

describe("formatDate", () => {
  it("formata data no padrão brasileiro usando UTC", () => {
    expect(formatDate("2026-05-27T03:00:00.000Z")).toBe("27/05/2026");
  });
});

describe("formatWeekday", () => {
  it("formata dia da semana em português usando UTC", () => {
    expect(formatWeekday("2026-05-27T03:00:00.000Z")).toBe("quarta-feira");
  });
});
