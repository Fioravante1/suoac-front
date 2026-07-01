import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchActiveEvent } from "./active-event-query";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    events: {
      list: (circuitId: string) => `/circuits/${circuitId}/events`,
    },
  },
  httpClient: httpClientMock,
}));

const activeEvent = { id: "evt-1", status: "OPEN" };

describe("fetchActiveEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta eventos OPEN do circuito com limite 1 e retorna o primeiro", async () => {
    httpClientMock.mockResolvedValue({ data: [activeEvent], meta: {} });

    const result = await fetchActiveEvent("circuit-1");

    expect(httpClientMock).toHaveBeenCalledWith("/circuits/circuit-1/events?status=OPEN&limit=1");
    expect(result).toEqual(activeEvent);
  });

  it("retorna null quando não há evento ativo", async () => {
    httpClientMock.mockResolvedValue({ data: [], meta: {} });

    expect(await fetchActiveEvent("circuit-1")).toBeNull();
  });
});
