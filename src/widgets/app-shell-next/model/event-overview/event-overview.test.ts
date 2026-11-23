import { afterEach, describe, expect, it, vi } from "vitest";

import { EVENT_DAY_STATUSES, EVENT_STATUSES, EVENT_TYPES, type Event, type EventStatus } from "@/entities/event";

import { getEventOverview } from "./event-overview";

function buildEvent(status: EventStatus): Event {
  return {
    id: "event-1",
    title: "Congresso Regional 2026",
    type: EVENT_TYPES.REGIONAL_CONVENTION,
    ticketPrice: "40.00",
    status,
    registrationDeadline: "2026-10-13T02:59:59.999Z",
    paymentDeadline: "2026-10-20T02:59:59.999Z",
    venue: "Salão de Assembleias",
    address: "Rua das Flores, 100",
    city: "Campinas",
    state: "SP",
    observations: null,
    circuitId: "circuit-1",
    createdById: "user-1",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-21T13:04:00.000Z",
    days: [
      {
        id: "day-1",
        dayNumber: 1,
        date: "2026-10-23T00:00:00.000Z",
        label: "",
        departureTime: "06:30",
        returnTime: "18:30",
        status: EVENT_DAY_STATUSES.ACTIVE,
        eventId: "event-1",
      },
    ],
  };
}

describe("getEventOverview", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calcula o resumo e as etapas para o mesmo dia", () => {
    const overview = getEventOverview(buildEvent(EVENT_STATUSES.OPEN), "2026-10-07");

    expect(overview.summary.countdown).toBe("Faltam 16 dias");
    expect(overview.timeline.stages[1].detail).toBe("12/10 · em 5 dias");
  });

  it("usa o hoje de São Paulo quando o dia não é dado", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-23T01:00:00.000Z"));

    // 22h de 22/10 em São Paulo: ainda falta um dia.
    expect(getEventOverview(buildEvent(EVENT_STATUSES.OPEN)).summary.countdown).toBe("Falta 1 dia");
  });

  it("dá as inscrições por abertas só com o evento aberto, como a linha de etapas", () => {
    expect(getEventOverview(buildEvent(EVENT_STATUSES.OPEN), "2026-10-23").isRegistrationOpen).toBe(true);
    expect(getEventOverview(buildEvent(EVENT_STATUSES.OPEN), "2026-10-23").timeline.stages[0].state).toBe("current");
    expect(getEventOverview(buildEvent(EVENT_STATUSES.CLOSED), "2026-10-07").isRegistrationOpen).toBe(false);
    expect(getEventOverview(buildEvent(EVENT_STATUSES.FINISHED), "2026-10-26").isRegistrationOpen).toBe(false);
  });
});
