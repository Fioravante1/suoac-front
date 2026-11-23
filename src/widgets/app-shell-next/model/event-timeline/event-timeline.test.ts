import { describe, expect, it } from "vitest";

import { EVENT_DAY_STATUSES, EVENT_STATUSES, type Event, type EventDayInEvent } from "@/entities/event";

import { EVENT_STAGE_KEYS, OPEN_SEGMENT_WITHOUT_START, getEventTimeline } from "./event-timeline";

function day(date: string, status: EventDayInEvent["status"] = EVENT_DAY_STATUSES.ACTIVE): EventDayInEvent {
  return {
    id: `day-${date}`,
    dayNumber: 1,
    date: `${date}T00:00:00.000Z`,
    label: "",
    departureTime: "06:30",
    returnTime: "18:30",
    status,
    eventId: "event-1",
  };
}

// O evento do `v3`: Congresso de 23 a 25/10, inscrições até 12/10, abertas em 21/09. O prazo vem
// como a API o grava: o último instante de 12/10 em São Paulo.
const congress: Pick<Event, "status" | "days" | "registrationDeadline" | "publishedAt" | "registrationClosedAt"> = {
  status: EVENT_STATUSES.OPEN,
  days: [day("2026-10-23"), day("2026-10-24"), day("2026-10-25")],
  registrationDeadline: "2026-10-13T02:59:59.999Z",
  publishedAt: "2026-09-21T13:04:00.000Z",
  registrationClosedAt: null,
};

function stateOf(timeline: ReturnType<typeof getEventTimeline>) {
  return timeline.stages.map((stage) => stage.state);
}

describe("getEventTimeline", () => {
  describe("com as inscrições abertas", () => {
    it("marca a abertura como a etapa atual, e as demais como por vir", () => {
      const timeline = getEventTimeline(congress, "2026-10-07");

      expect(stateOf(timeline)).toEqual(["current", "upcoming", "upcoming", "upcoming"]);
      expect(timeline.isLive).toBe(true);
    });

    it("escreve as linhas de apoio do v3", () => {
      const [opened, closed, event, finished] = getEventTimeline(congress, "2026-10-07").stages;

      expect(opened.detail).toBe("desde 21/09");
      expect(closed.detail).toBe("12/10 · em 5 dias");
      expect(closed.compactDetail).toBe("12/10 · 5 dias");
      expect(closed.isDeadlineAhead).toBe(true);
      expect(event.detail).toBe("23 a 25/10");
      expect(finished.detail).toBe("após 25/10");
    });

    it("lê o prazo no dia dele em São Paulo, e não no dia seguinte do UTC", () => {
      expect(getEventTimeline(congress, "2026-10-07").stages[1].detail).toMatch(/^12\/10 /);
    });

    it("avisa quando o encerramento é amanhã ou hoje", () => {
      expect(getEventTimeline(congress, "2026-10-11").stages[1].detail).toBe("12/10 · amanhã");
      expect(getEventTimeline(congress, "2026-10-12").stages[1].detail).toBe("12/10 · hoje");
      expect(getEventTimeline(congress, "2026-10-12").stages[1].compactDetail).toBe("12/10 · hoje");
    });

    it("preenche o primeiro trecho com os dias já corridos do período de inscrição", () => {
      // 16 dos 21 dias entre 21/09 e 12/10, como os 76% do v3.
      expect(getEventTimeline(congress, "2026-10-07").segments).toEqual([16 / 21, 0, 0]);
    });

    it("lê a abertura no fuso de São Paulo, mesmo publicada às 22h de lá", () => {
      const lateNight = { ...congress, publishedAt: "2026-09-22T01:00:00.000Z" };

      expect(getEventTimeline(lateNight, "2026-10-07").stages[0].detail).toBe("desde 21/09");
    });

    it("sem a data de abertura, some com o 'desde' e usa o preenchimento fixo do celular", () => {
      const withoutStart = { ...congress, publishedAt: undefined };
      const timeline = getEventTimeline(withoutStart, "2026-10-07");

      expect(timeline.stages[0].detail).toBeNull();
      expect(timeline.segments).toEqual([OPEN_SEGMENT_WITHOUT_START, 0, 0]);
    });

    it("trata a abertura nula, de evento publicado antes de a API guardar a data, como ausente", () => {
      const timeline = getEventTimeline({ ...congress, publishedAt: null }, "2026-10-07");

      expect(timeline.stages[0].detail).toBeNull();
      expect(timeline.segments[0]).toBe(OPEN_SEGMENT_WITHOUT_START);
    });

    it("com o prazo vencido e o evento ainda aberto, mostra só a data, sem contagem nem âmbar", () => {
      // 13/10, antes de o ciclo de vida encerrar o evento, ou numa aba aberta desde a véspera.
      const closed = getEventTimeline(congress, "2026-10-13").stages[1];

      expect(closed.detail).toBe("12/10");
      expect(closed.compactDetail).toBe("12/10");
      expect(closed.isDeadlineAhead).toBe(false);
    });

    it("não passa do trecho inteiro quando o prazo vence e o encerramento ainda não rodou", () => {
      expect(getEventTimeline(congress, "2026-10-14").segments[0]).toBe(1);
    });

    it("enche o trecho quando a abertura foi no próprio dia do prazo", () => {
      const sameDay = { ...congress, publishedAt: "2026-10-12T12:00:00.000Z" };

      expect(getEventTimeline(sameDay, "2026-10-12").segments[0]).toBe(1);
    });
  });

  describe("com as inscrições encerradas", () => {
    const closedEvent = { ...congress, status: EVENT_STATUSES.CLOSED };

    it("marca a abertura como feita e o encerramento como a etapa atual", () => {
      const timeline = getEventTimeline(closedEvent, "2026-10-16");

      expect(stateOf(timeline)).toEqual(["done", "current", "upcoming", "upcoming"]);
      expect(timeline.segments).toEqual([1, 0, 0]);
      expect(timeline.isLive).toBe(true);
    });

    it("escreve a data do encerramento no lugar da contagem", () => {
      const closed = getEventTimeline(
        { ...closedEvent, registrationClosedAt: "2026-10-13T02:59:59.999Z" },
        "2026-10-16",
      ).stages[1];

      expect(closed.detail).toBe("em 12/10");
      expect(closed.compactDetail).toBe("12/10 · encerradas");
      expect(closed.isDeadlineAhead).toBe(false);
    });

    it("mostra a data real do evento encerrado antes do prazo, lida em São Paulo", () => {
      // Encerrado às 22h30 de 08/10 em São Paulo, quando em UTC já era 09/10.
      const earlyClose = { ...closedEvent, registrationClosedAt: "2026-10-09T01:30:00.000Z" };
      const timeline = getEventTimeline(earlyClose, "2026-10-09");

      expect(timeline.stages[1].state).toBe("current");
      expect(timeline.stages[1].detail).toBe("em 08/10");
    });

    it("sem a data do encerramento, de evento antigo: no desktop o rótulo basta, no celular diz 'encerradas'", () => {
      const closed = getEventTimeline(closedEvent, "2026-10-16").stages[1];

      expect(closed.detail).toBeNull();
      expect(closed.compactDetail).toBe("encerradas");
    });
  });

  describe("durante o evento", () => {
    it("segue na abertura enquanto as inscrições estiverem abertas, com o prazo depois do primeiro dia", () => {
      const lateDeadline = { ...congress, registrationDeadline: "2026-10-25T02:59:59.999Z" };
      const timeline = getEventTimeline(lateDeadline, "2026-10-23");

      expect(stateOf(timeline)).toEqual(["current", "upcoming", "upcoming", "upcoming"]);
      expect(timeline.stages[1].detail).toBe("24/10 · amanhã");
      expect(timeline.stages[1].isDeadlineAhead).toBe(true);
    });

    it("passa a etapa atual para o evento a partir do primeiro dia, ainda com status encerrado", () => {
      const timeline = getEventTimeline({ ...congress, status: EVENT_STATUSES.CLOSED }, "2026-10-23");

      expect(stateOf(timeline)).toEqual(["done", "done", "current", "upcoming"]);
      expect(timeline.segments).toEqual([1, 1, 0]);
      expect(timeline.isLive).toBe(true);
    });

    it("segue no evento até o fim do último dia, antes de o status virar finalizado", () => {
      const timeline = getEventTimeline({ ...congress, status: EVENT_STATUSES.CLOSED }, "2026-10-25");

      expect(timeline.stages[2].state).toBe("current");
    });
  });

  describe("com o evento finalizado", () => {
    it("marca a última etapa como a atual, sem pulsar, e enche a linha", () => {
      const timeline = getEventTimeline({ ...congress, status: EVENT_STATUSES.FINISHED }, "2026-10-26");

      expect(stateOf(timeline)).toEqual(["done", "done", "done", "current"]);
      expect(timeline.segments).toEqual([1, 1, 1]);
      expect(timeline.isLive).toBe(false);
    });
  });

  it("conta só os dias ativos no período", () => {
    const withCancelledLastDay = {
      ...congress,
      days: [day("2026-10-23"), day("2026-10-24"), day("2026-10-25", EVENT_DAY_STATUSES.CANCELLED)],
    };
    const [, , event, finished] = getEventTimeline(withCancelledLastDay, "2026-10-07").stages;

    expect(event.detail).toBe("23 a 24/10");
    expect(finished.detail).toBe("após 24/10");
  });

  it("escreve um dia só quando o evento tem um dia", () => {
    const assembly = { ...congress, days: [day("2026-11-14")] };

    expect(getEventTimeline(assembly, "2026-10-07").stages[2].detail).toBe("14/11");
  });

  it("não quebra sem dias, deixando sem apoio as etapas que dependem deles", () => {
    const [, , event, finished] = getEventTimeline({ ...congress, days: [] }, "2026-10-07").stages;

    expect(event.detail).toBeNull();
    expect(finished.detail).toBeNull();
  });

  it("expõe as etapas na ordem do desenho", () => {
    expect(getEventTimeline(congress, "2026-10-07").stages.map((stage) => stage.key)).toEqual([
      EVENT_STAGE_KEYS.REGISTRATION_OPEN,
      EVENT_STAGE_KEYS.REGISTRATION_CLOSED,
      EVENT_STAGE_KEYS.EVENT,
      EVENT_STAGE_KEYS.FINISHED,
    ]);
  });
});
