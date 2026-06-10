import { describe, expect, it, vi } from "vitest";

import { formatDate, formatDateRange, formatWeekday, toDateString, getTodayDateString } from "./date-formatters";

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

describe("formatDateRange", () => {
  it("retorna string vazia para array vazio", () => {
    expect(formatDateRange([])).toBe("");
  });

  it("retorna data unica quando ha apenas uma data", () => {
    expect(formatDateRange(["2026-05-27T03:00:00.000Z"])).toBe("27/05/2026");
  });

  it("retorna data unica quando primeira e ultima sao iguais", () => {
    expect(formatDateRange(["2026-05-27T03:00:00.000Z", "2026-05-27T03:00:00.000Z"])).toBe("27/05/2026");
  });

  it("retorna range quando primeira e ultima sao diferentes", () => {
    expect(formatDateRange(["2026-05-27T03:00:00.000Z", "2026-05-28T03:00:00.000Z", "2026-05-29T03:00:00.000Z"])).toBe(
      "27/05/2026 - 29/05/2026",
    );
  });
});

describe("toDateString", () => {
  it("formata Date no padrao YYYY-MM-DD", () => {
    expect(toDateString(new Date(2026, 4, 27))).toBe("2026-05-27");
  });

  it("adiciona zero a esquerda em mes e dia", () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
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
