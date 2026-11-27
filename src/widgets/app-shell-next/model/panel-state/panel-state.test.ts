import { describe, expect, it } from "vitest";

import { EVENT_TYPES, EVENT_STATUSES, EVENT_DAY_STATUSES, type Event } from "@/entities/event";

import { resolvePanelMode } from "./panel-state";

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

describe("resolvePanelMode", () => {
  it("distingue carregamento de circuito sem evento", () => {
    expect(resolvePanelMode(undefined, true)).toBeNull();
    expect(resolvePanelMode(null, true)).toBe("empty");
  });

  it.each(Object.values(EVENT_STATUSES))("resolve %s conforme o papel", (status) => {
    const event = buildEvent({ status });
    const expected = { DRAFT: "draft", CANCELLED: "cancelled", OPEN: "live", CLOSED: "live", FINISHED: "live" }[status];
    expect(resolvePanelMode(event, true)).toBe(expected);
    expect(resolvePanelMode(event, false)).toBe(status === EVENT_STATUSES.DRAFT ? "empty" : expected);
  });
});
