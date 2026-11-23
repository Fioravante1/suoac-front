import { describe, expect, it, vi } from "vitest";

import {
  diffInCalendarDays,
  formatDate,
  formatDateRange,
  formatDayMonth,
  formatDayMonthRange,
  formatDaysRemaining,
  formatMonthName,
  formatShortDateRange,
  formatWeekday,
  formatWeekdayShort,
  toDateString,
  toDateStringInTimeZone,
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

describe("formatShortDateRange", () => {
  const today = new Date("2026-10-29T12:00:00.000Z");

  it("escreve um dia só com dia e mês abreviado, sem ponto", () => {
    expect(formatShortDateRange("2026-11-14T00:00:00.000Z", "2026-11-14T00:00:00.000Z", today)).toBe("14 nov");
  });

  it("junta os dias do mesmo mês com travessão, sem espaços", () => {
    expect(formatShortDateRange("2026-10-23T00:00:00.000Z", "2026-10-25T00:00:00.000Z", today)).toBe("23–25 out");
  });

  it("separa meses diferentes com travessão entre espaços", () => {
    expect(formatShortDateRange("2026-10-30T00:00:00.000Z", "2026-11-01T00:00:00.000Z", today)).toBe("30 out – 1 nov");
  });

  it("mostra o ano quando não é o ano corrente", () => {
    expect(formatShortDateRange("2025-03-15T00:00:00.000Z", "2025-03-15T00:00:00.000Z", today)).toBe("15 mar 2025");
    expect(formatShortDateRange("2027-05-07T00:00:00.000Z", "2027-05-09T00:00:00.000Z", today)).toBe("7–9 mai 2027");
  });

  it("mostra o ano nas duas pontas quando o intervalo atravessa a virada do ano", () => {
    expect(formatShortDateRange("2026-12-31T00:00:00.000Z", "2027-01-02T00:00:00.000Z", today)).toBe(
      "31 dez 2026 – 2 jan 2027",
    );
  });

  it("lê a data em UTC, como a API grava os dias", () => {
    expect(formatShortDateRange("2026-11-01T00:00:00.000Z", "2026-11-01T00:00:00.000Z", today)).toBe("1 nov");
  });
});

describe("formatDayMonth", () => {
  it("escreve dia e mês com dois dígitos, sem o ano", () => {
    expect(formatDayMonth("2026-10-12T00:00:00.000Z")).toBe("12/10");
    expect(formatDayMonth("2026-09-05T00:00:00.000Z")).toBe("05/09");
  });

  it("lê a data em UTC, como a API grava os dias", () => {
    expect(formatDayMonth("2026-11-01T00:00:00.000Z")).toBe("01/11");
  });
});

describe("formatDayMonthRange", () => {
  it("escreve um dia só quando o intervalo começa e termina no mesmo dia", () => {
    expect(formatDayMonthRange("2026-11-14T00:00:00.000Z", "2026-11-14T00:00:00.000Z")).toBe("14/11");
  });

  it("junta os dias do mesmo mês, com o mês só no fim", () => {
    expect(formatDayMonthRange("2026-10-23T00:00:00.000Z", "2026-10-25T00:00:00.000Z")).toBe("23 a 25/10");
    expect(formatDayMonthRange("2026-10-02T00:00:00.000Z", "2026-10-04T00:00:00.000Z")).toBe("02 a 04/10");
  });

  it("repete o mês quando o intervalo atravessa a virada do mês", () => {
    expect(formatDayMonthRange("2026-10-30T00:00:00.000Z", "2026-11-01T00:00:00.000Z")).toBe("30/10 a 01/11");
  });

  it("não confunde o mesmo mês de anos diferentes", () => {
    expect(formatDayMonthRange("2026-01-30T00:00:00.000Z", "2027-01-01T00:00:00.000Z")).toBe("30/01 a 01/01");
  });
});

describe("formatMonthName", () => {
  it("escreve só o mês por extenso, lido em UTC", () => {
    expect(formatMonthName("2026-10-01T00:00:00.000Z")).toBe("outubro");
  });
});

describe("toDateStringInTimeZone", () => {
  it("devolve a data de calendário no fuso pedido", () => {
    expect(toDateStringInTimeZone(new Date("2026-10-12T15:00:00.000Z"), "America/Sao_Paulo")).toBe("2026-10-12");
  });

  it("ainda é o mesmo dia em São Paulo às 22h, quando em UTC já é o seguinte", () => {
    expect(toDateStringInTimeZone(new Date("2026-10-13T01:00:00.000Z"), "America/Sao_Paulo")).toBe("2026-10-12");
  });

  it("vira o dia em São Paulo à meia-noite de lá", () => {
    expect(toDateStringInTimeZone(new Date("2026-10-13T03:00:00.000Z"), "America/Sao_Paulo")).toBe("2026-10-13");
  });

  it("escreve sempre ano, mês e dia com zeros, em qualquer fuso", () => {
    expect(toDateStringInTimeZone(new Date("2026-01-05T12:00:00.000Z"), "UTC")).toBe("2026-01-05");
    expect(toDateStringInTimeZone(new Date("2026-01-05T12:00:00.000Z"), "Asia/Tokyo")).toBe("2026-01-05");
  });
});

describe("diffInCalendarDays", () => {
  it("conta os dias de calendário entre duas datas", () => {
    expect(diffInCalendarDays("2026-10-07", "2026-10-12")).toBe(5);
  });

  it("é zero no mesmo dia e negativo quando o destino já passou", () => {
    expect(diffInCalendarDays("2026-10-12", "2026-10-12")).toBe(0);
    expect(diffInCalendarDays("2026-10-12", "2026-10-09")).toBe(-3);
  });

  it("aceita o ISO completo da API e considera só a data", () => {
    expect(diffInCalendarDays("2026-10-07", "2026-10-23T00:00:00.000Z")).toBe(16);
    expect(diffInCalendarDays("2026-09-21T23:30:00.000Z", "2026-10-12T00:00:00.000Z")).toBe(21);
  });

  it("atravessa a virada do mês e do ano", () => {
    expect(diffInCalendarDays("2026-12-30", "2027-01-02")).toBe(3);
  });
});
