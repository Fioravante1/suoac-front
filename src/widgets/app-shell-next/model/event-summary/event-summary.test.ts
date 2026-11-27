import { describe, expect, it } from "vitest";

import {
  EVENT_DAY_STATUSES,
  EVENT_STATUSES,
  EVENT_TYPES,
  type Event,
  type EventDayInEvent,
  type EventDayStatus,
} from "@/entities/event";

import { SCHEDULE_VARIES_LABEL, getEventSummary, hasEventTimeline } from "./event-summary";

type DayOptions = { departureTime?: string; returnTime?: string; status?: EventDayStatus };

function day(
  date: string,
  { departureTime = "06:30", returnTime = "18:30", status = EVENT_DAY_STATUSES.ACTIVE }: DayOptions = {},
): EventDayInEvent {
  return {
    id: `day-${date}`,
    dayNumber: 1,
    date: `${date}T00:00:00.000Z`,
    label: "",
    departureTime,
    returnTime,
    status,
    eventId: "event-1",
  };
}

const congress: Pick<Event, "type" | "days" | "venue" | "city" | "state" | "ticketPrice"> = {
  type: EVENT_TYPES.REGIONAL_CONVENTION,
  days: [day("2026-10-25"), day("2026-10-23"), day("2026-10-24")],
  venue: "Salão de Assembleias",
  city: "Campinas",
  state: "SP",
  ticketPrice: "40.00",
};

describe("getEventSummary", () => {
  it("preserva número de dias e horários quando o cancelamento cancela todos os dias", () => {
    const cancelled = {
      ...congress,
      days: congress.days!.map((item) => ({ ...item, status: EVENT_DAY_STATUSES.CANCELLED })),
    };
    const summary = getEventSummary(cancelled, "2026-10-07");
    expect(summary.typeLabel).toBe("Congresso regional · 3 dias");
    expect(summary.schedule).toBe("Saída 06:30 · retorno 18:30");
  });

  it("mostra os dias ativos em ordem, com o dia da semana abreviado", () => {
    expect(getEventSummary(congress, "2026-10-07").dayTiles).toEqual([
      { id: "day-2026-10-23", weekday: "Sex", day: "23" },
      { id: "day-2026-10-24", weekday: "Sáb", day: "24" },
      { id: "day-2026-10-25", weekday: "Dom", day: "25" },
    ]);
  });

  it("deixa de fora os dias cancelados", () => {
    const withCancelledDay = {
      ...congress,
      days: [day("2026-10-23"), day("2026-10-24", { status: EVENT_DAY_STATUSES.CANCELLED })],
    };

    expect(getEventSummary(withCancelledDay, "2026-10-07").dayTiles.map((tile) => tile.day)).toEqual(["23"]);
  });

  describe("contagem regressiva", () => {
    it("conta os dias até o primeiro dia do evento, em São Paulo", () => {
      expect(getEventSummary(congress, "2026-10-07").countdown).toBe("Faltam 16 dias");
    });

    it("fica no singular na véspera", () => {
      expect(getEventSummary(congress, "2026-10-22").countdown).toBe("Falta 1 dia");
    });

    it("some no primeiro dia do evento e depois dele", () => {
      expect(getEventSummary(congress, "2026-10-23").countdown).toBeNull();
      expect(getEventSummary(congress, "2026-10-26").countdown).toBeNull();
    });
  });

  describe("mês do evento", () => {
    it("escreve o mês por extenso e o ano", () => {
      expect(getEventSummary(congress, "2026-10-07").months).toBe("outubro de 2026");
    });

    it("junta os meses quando o evento atravessa a virada do mês", () => {
      const acrossMonths = { ...congress, days: [day("2026-10-31"), day("2026-11-01")] };

      expect(getEventSummary(acrossMonths, "2026-10-07").months).toBe("outubro e novembro de 2026");
    });

    it("escreve os dois anos quando o evento atravessa a virada do ano", () => {
      const acrossYears = { ...congress, days: [day("2026-12-31"), day("2027-01-01")] };

      expect(getEventSummary(acrossYears, "2026-10-07").months).toBe("dezembro de 2026 e janeiro de 2027");
    });
  });

  it("escreve o tipo com o número de dias ativos", () => {
    expect(getEventSummary(congress, "2026-10-07").typeLabel).toBe("Congresso regional · 3 dias");

    const assembly = { ...congress, type: EVENT_TYPES.ASSEMBLY, days: [day("2026-11-14")] };
    expect(getEventSummary(assembly, "2026-10-07").typeLabel).toBe("Assembleia · 1 dia");
  });

  it("escreve o local com a UF no desktop e sem ela no celular", () => {
    const summary = getEventSummary(congress, "2026-10-07");

    expect(summary.location).toBe("Salão de Assembleias · Campinas, SP");
    expect(summary.compactLocation).toBe("Salão de Assembleias · Campinas");
  });

  describe("saída e retorno", () => {
    it("mostra um horário só quando todos os dias ativos têm o mesmo", () => {
      expect(getEventSummary(congress, "2026-10-07").schedule).toBe("Saída 06:30 · retorno 18:30");
    });

    it("avisa que os horários variam quando os dias não batem", () => {
      const varying = { ...congress, days: [day("2026-10-23"), day("2026-10-24", { returnTime: "17:00" })] };

      expect(getEventSummary(varying, "2026-10-07").schedule).toBe(SCHEDULE_VARIES_LABEL);
    });

    it("ignora o horário de um dia cancelado", () => {
      const withCancelledDay = {
        ...congress,
        days: [day("2026-10-23"), day("2026-10-24", { departureTime: "05:00", status: EVENT_DAY_STATUSES.CANCELLED })],
      };

      expect(getEventSummary(withCancelledDay, "2026-10-07").schedule).toBe("Saída 06:30 · retorno 18:30");
    });

    it("não mostra horário sem dias ativos", () => {
      expect(getEventSummary({ ...congress, days: [] }, "2026-10-07").schedule).toBeNull();
    });
  });

  it("escreve o valor por dia sem centavos quando são zero", () => {
    expect(getEventSummary(congress, "2026-10-07").price).toBe("R$ 40 por dia");
    expect(getEventSummary({ ...congress, ticketPrice: "42.50" }, "2026-10-07").price).toBe("R$ 42,50 por dia");
  });

  it("não quebra sem dias", () => {
    const summary = getEventSummary({ ...congress, days: undefined }, "2026-10-07");

    expect(summary.dayTiles).toEqual([]);
    expect(summary.countdown).toBeNull();
    expect(summary.months).toBeNull();
    expect(summary.typeLabel).toBe("Congresso regional · 0 dias");
  });
});

describe("hasEventTimeline", () => {
  it("vale para o evento publicado: inscrições abertas, encerradas e finalizado", () => {
    expect(hasEventTimeline(EVENT_STATUSES.OPEN)).toBe(true);
    expect(hasEventTimeline(EVENT_STATUSES.CLOSED)).toBe(true);
    expect(hasEventTimeline(EVENT_STATUSES.FINISHED)).toBe(true);
  });

  it("não vale para rascunho nem cancelado, que têm outro resumo", () => {
    expect(hasEventTimeline(EVENT_STATUSES.DRAFT)).toBe(false);
    expect(hasEventTimeline(EVENT_STATUSES.CANCELLED)).toBe(false);
  });
});
