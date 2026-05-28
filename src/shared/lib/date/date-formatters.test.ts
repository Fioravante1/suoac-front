import { describe, expect, it, vi } from "vitest";

import { formatDate, formatWeekday, getTodayDateString } from "./date-formatters";

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

describe("getTodayDateString", () => {
  it("retorna a data de hoje no formato YYYY-MM-DD", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T14:30:00.000Z"));

    expect(getTodayDateString()).toBe("2026-07-15");

    vi.useRealTimers();
  });
});
