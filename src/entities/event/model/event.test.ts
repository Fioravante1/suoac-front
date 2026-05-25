import { describe, expect, it } from "vitest";

import {
  EVENT_DAY_STATUSES,
  EVENT_STATUSES,
  canCancelEventDay,
  canCancelEventStatus,
  canUpdateEventDayTimes,
  isLastActiveDayInEvent,
  type EventDayInEvent,
} from "./event";

describe("canUpdateEventDayTimes", () => {
  it("retorna true para evento DRAFT com dia ACTIVE", () => {
    expect(canUpdateEventDayTimes(EVENT_STATUSES.DRAFT, EVENT_DAY_STATUSES.ACTIVE)).toBe(true);
  });

  it("retorna true para evento OPEN com dia ACTIVE", () => {
    expect(canUpdateEventDayTimes(EVENT_STATUSES.OPEN, EVENT_DAY_STATUSES.ACTIVE)).toBe(true);
  });

  it("retorna false para evento CLOSED com dia ACTIVE", () => {
    expect(canUpdateEventDayTimes(EVENT_STATUSES.CLOSED, EVENT_DAY_STATUSES.ACTIVE)).toBe(false);
  });

  it("retorna false para evento FINISHED com dia ACTIVE", () => {
    expect(canUpdateEventDayTimes(EVENT_STATUSES.FINISHED, EVENT_DAY_STATUSES.ACTIVE)).toBe(false);
  });

  it("retorna false para evento DRAFT com dia CANCELLED", () => {
    expect(canUpdateEventDayTimes(EVENT_STATUSES.DRAFT, EVENT_DAY_STATUSES.CANCELLED)).toBe(false);
  });

  it("retorna false para evento OPEN com dia CANCELLED", () => {
    expect(canUpdateEventDayTimes(EVENT_STATUSES.OPEN, EVENT_DAY_STATUSES.CANCELLED)).toBe(false);
  });

  it("retorna false para evento CANCELLED", () => {
    expect(canUpdateEventDayTimes(EVENT_STATUSES.CANCELLED, EVENT_DAY_STATUSES.ACTIVE)).toBe(false);
  });
});

describe("canCancelEventDay", () => {
  it("retorna true para evento DRAFT com dia ACTIVE", () => {
    expect(canCancelEventDay(EVENT_STATUSES.DRAFT, EVENT_DAY_STATUSES.ACTIVE)).toBe(true);
  });

  it("retorna true para evento OPEN com dia ACTIVE", () => {
    expect(canCancelEventDay(EVENT_STATUSES.OPEN, EVENT_DAY_STATUSES.ACTIVE)).toBe(true);
  });

  it("retorna false para evento CLOSED com dia ACTIVE", () => {
    expect(canCancelEventDay(EVENT_STATUSES.CLOSED, EVENT_DAY_STATUSES.ACTIVE)).toBe(false);
  });

  it("retorna false para evento FINISHED com dia ACTIVE", () => {
    expect(canCancelEventDay(EVENT_STATUSES.FINISHED, EVENT_DAY_STATUSES.ACTIVE)).toBe(false);
  });

  it("retorna false para evento DRAFT com dia CANCELLED", () => {
    expect(canCancelEventDay(EVENT_STATUSES.DRAFT, EVENT_DAY_STATUSES.CANCELLED)).toBe(false);
  });

  it("retorna false para evento OPEN com dia CANCELLED", () => {
    expect(canCancelEventDay(EVENT_STATUSES.OPEN, EVENT_DAY_STATUSES.CANCELLED)).toBe(false);
  });

  it("retorna false para evento CANCELLED", () => {
    expect(canCancelEventDay(EVENT_STATUSES.CANCELLED, EVENT_DAY_STATUSES.ACTIVE)).toBe(false);
  });
});

describe("canCancelEventStatus", () => {
  it("retorna true para DRAFT", () => {
    expect(canCancelEventStatus(EVENT_STATUSES.DRAFT)).toBe(true);
  });

  it("retorna true para OPEN", () => {
    expect(canCancelEventStatus(EVENT_STATUSES.OPEN)).toBe(true);
  });

  it("retorna false para CLOSED", () => {
    expect(canCancelEventStatus(EVENT_STATUSES.CLOSED)).toBe(false);
  });

  it("retorna false para FINISHED", () => {
    expect(canCancelEventStatus(EVENT_STATUSES.FINISHED)).toBe(false);
  });

  it("retorna false para CANCELLED", () => {
    expect(canCancelEventStatus(EVENT_STATUSES.CANCELLED)).toBe(false);
  });
});

describe("isLastActiveDayInEvent", () => {
  const baseDay: EventDayInEvent = {
    id: "day-1",
    dayNumber: 1,
    date: "2026-07-10T00:00:00.000Z",
    label: "Dia 1",
    departureTime: "06:00",
    returnTime: "18:00",
    status: EVENT_DAY_STATUSES.ACTIVE,
    eventId: "event-1",
  };

  it("retorna true quando há exatamente 1 dia ativo", () => {
    const days: EventDayInEvent[] = [baseDay, { ...baseDay, id: "day-2", status: EVENT_DAY_STATUSES.CANCELLED }];

    expect(isLastActiveDayInEvent(days)).toBe(true);
  });

  it("retorna false quando há 0 dias ativos", () => {
    const days: EventDayInEvent[] = [
      { ...baseDay, status: EVENT_DAY_STATUSES.CANCELLED },
      { ...baseDay, id: "day-2", status: EVENT_DAY_STATUSES.CANCELLED },
    ];

    expect(isLastActiveDayInEvent(days)).toBe(false);
  });

  it("retorna false quando há 2 ou mais dias ativos", () => {
    const days: EventDayInEvent[] = [baseDay, { ...baseDay, id: "day-2" }];

    expect(isLastActiveDayInEvent(days)).toBe(false);
  });

  it("retorna false para lista vazia", () => {
    expect(isLastActiveDayInEvent([])).toBe(false);
  });
});
