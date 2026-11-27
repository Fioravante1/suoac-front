import { describe, expect, it } from "vitest";

import {
  formatCongregationScope,
  CONGREGATION_LIST_STATUSES,
  countUnfinalizedCongregations,
  type CongregationEventStatus,
} from "./congregation";

function statusOf(name: string, status: CongregationEventStatus["status"]): CongregationEventStatus {
  return {
    id: null,
    status,
    congregationId: `congregation-${name}`,
    congregationName: name,
    eventId: "event-1",
    finalizedById: null,
    finalizedAt: null,
    createdAt: "2026-10-01T00:00:00.000Z",
  };
}

describe("countUnfinalizedCongregations", () => {
  it("conta as congregações que ainda não finalizaram a lista", () => {
    const statuses = [
      statusOf("Centro", CONGREGATION_LIST_STATUSES.FINALIZED),
      statusOf("Norte", CONGREGATION_LIST_STATUSES.PENDING),
      statusOf("Sul", CONGREGATION_LIST_STATUSES.PENDING),
    ];

    expect(countUnfinalizedCongregations(statuses)).toBe(2);
  });

  it("dá zero sem congregações", () => {
    expect(countUnfinalizedCongregations([])).toBe(0);
  });
});

describe("formatCongregationScope", () => {
  it("identifica a congregação por nome e código", () => {
    expect(formatCongregationScope({ name: "Jardim Paulista", code: "31245" })).toBe("Jardim Paulista · Cód. 31245");
  });
});
