import { describe, expect, it, vi } from "vitest";

import {
  daysFromToday,
  formatDate,
  formatDateRange,
  formatDaysRemaining,
  formatWeekday,
  formatWeekdayShort,
  toDateString,
  getTodayDateString,
} from "./date-formatters";

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

describe("formatWeekdayShort", () => {
  it("formata dia da semana abreviado, capitalizado e sem ponto", () => {
    expect(formatWeekdayShort("2026-07-10T00:00:00.000Z")).toBe("Sex");
    expect(formatWeekdayShort("2026-07-11T00:00:00.000Z")).toBe("Sáb");
    expect(formatWeekdayShort("2026-07-12T00:00:00.000Z")).toBe("Dom");
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

describe("daysFromToday", () => {
  it("retorna numero positivo para data futura", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);

    expect(daysFromToday(toDateString(future))).toBe(5);
  });

  it("retorna 0 para data de hoje", () => {
    expect(daysFromToday(toDateString(new Date()))).toBe(0);
  });

  it("retorna numero negativo para data passada", () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);

    expect(daysFromToday(toDateString(past))).toBe(-3);
  });

  it("funciona com data ISO completa (com horario)", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const isoStr = `${toDateString(future)}T15:00:00.000Z`;

    expect(daysFromToday(isoStr)).toBe(5);
  });
});

describe("formatDaysRemaining", () => {
  it("retorna texto de expirado para dias negativos", () => {
    expect(formatDaysRemaining(-1)).toBe("Expirado hà 1 dia");
    expect(formatDaysRemaining(-5)).toBe("Expirado hà 5 dias");
  });

  it("retorna 'Hoje' para 0 dias", () => {
    expect(formatDaysRemaining(0)).toBe("Hoje");
  });

  it("retorna 'Amanha' para 1 dia", () => {
    expect(formatDaysRemaining(1)).toBe("Amanhã");
  });

  it("retorna dias restantes para mais de 1 dia", () => {
    expect(formatDaysRemaining(10)).toBe("10 dias restantes");
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
