import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCurrentEvent } from "./current-event-query";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    events: {
      current: (circuitId: string) => `/circuits/${circuitId}/events/current`,
    },
  },
  httpClient: httpClientMock,
}));

const currentEvent = { id: "evt-1", status: "OPEN", days: [] };

describe("fetchCurrentEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta o evento atual do circuito e o retorna", async () => {
    httpClientMock.mockResolvedValue(currentEvent);

    const result = await fetchCurrentEvent("circuit-1");

    expect(httpClientMock).toHaveBeenCalledWith("/circuits/circuit-1/events/current");
    expect(result).toEqual(currentEvent);
  });

  it("retorna null quando a API responde 204, sem evento atual", async () => {
    httpClientMock.mockResolvedValue(undefined);

    expect(await fetchCurrentEvent("circuit-1")).toBeNull();
  });

  it("propaga a falha da API", async () => {
    httpClientMock.mockRejectedValue(new Error("Network error"));

    await expect(fetchCurrentEvent("circuit-1")).rejects.toThrow("Network error");
  });
});
