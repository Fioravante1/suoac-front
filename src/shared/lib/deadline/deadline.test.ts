import { describe, expect, it } from "vitest";

import { DEADLINE_URGENCIES, getDeadlineUrgency } from "./deadline";

describe("getDeadlineUrgency", () => {
  it("retorna 'expired' para dias negativos", () => {
    expect(getDeadlineUrgency(-1)).toBe(DEADLINE_URGENCIES.expired);
    expect(getDeadlineUrgency(-10)).toBe(DEADLINE_URGENCIES.expired);
  });

  it("retorna 'urgent' para 0 a 3 dias", () => {
    expect(getDeadlineUrgency(0)).toBe(DEADLINE_URGENCIES.urgent);
    expect(getDeadlineUrgency(1)).toBe(DEADLINE_URGENCIES.urgent);
    expect(getDeadlineUrgency(3)).toBe(DEADLINE_URGENCIES.urgent);
  });

  it("retorna 'approaching' para 4 a 7 dias", () => {
    expect(getDeadlineUrgency(4)).toBe(DEADLINE_URGENCIES.approaching);
    expect(getDeadlineUrgency(7)).toBe(DEADLINE_URGENCIES.approaching);
  });

  it("retorna 'safe' para mais de 7 dias", () => {
    expect(getDeadlineUrgency(8)).toBe(DEADLINE_URGENCIES.safe);
    expect(getDeadlineUrgency(30)).toBe(DEADLINE_URGENCIES.safe);
  });
});
