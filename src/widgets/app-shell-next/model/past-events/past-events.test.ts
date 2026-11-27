import { describe, expect, it } from "vitest";

import { EVENT_TYPES, EVENT_STATUSES, EVENT_DAY_STATUSES, type Event } from "@/entities/event";

import { selectPastEvents } from "./past-events";

function buildEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-1",
    title: "Assembleia",
    type: EVENT_TYPES.ASSEMBLY,
    status: EVENT_STATUSES.DRAFT,
    ticketPrice: "40",
    venue: "Salão",
    address: "Rua A",
    city: "Campinas",
    state: "SP",
    registrationDeadline: "2026-10-13T02:59:59.999Z",
    paymentDeadline: "2026-10-20T02:59:59.999Z",
    circuitId: "circuit-1",
    createdById: "user-1",
    observations: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    days: [
      {
        id: "day-1",
        dayNumber: 1,
        date: "2026-11-14T00:00:00Z",
        departureTime: "06:30",
        returnTime: "18:30",
        status: EVENT_DAY_STATUSES.ACTIVE,
        label: "",
        eventId: "event-1",
      },
    ],
    ...overrides,
  };
}

describe("selectPastEvents", () => {
  it("lista só finalizados/cancelados, mais recentes primeiro, com limite", () => {
    const older = buildEvent({ id: "older", status: EVENT_STATUSES.FINISHED, days: [] });
    const recent = buildEvent({ id: "recent", status: EVENT_STATUSES.CANCELLED });
    expect(selectPastEvents([older, buildEvent(), recent], 1).map((item) => item.event.id)).toEqual(["recent"]);
  });

  it("usa criação quando não há dias", () => {
    const [item] = selectPastEvents([buildEvent({ status: EVENT_STATUSES.FINISHED, days: [] })]);
    expect(item).toMatchObject({ monthShort: "jan", yearShort: "26", subtitle: "Assembleia · 0 dias · Finalizado" });
  });
});
