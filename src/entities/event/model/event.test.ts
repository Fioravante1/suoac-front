import { describe, expect, it } from "vitest";

import { EVENT_DAY_STATUSES, EVENT_STATUSES, canCancelEventDay, canUpdateEventDayTimes } from "./event";

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
