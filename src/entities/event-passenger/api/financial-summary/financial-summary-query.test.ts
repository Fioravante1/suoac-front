import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchFinancialSummary } from "./financial-summary-query";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    events: {
      financialSummary: (eventId: string) => `/events/${eventId}/financial-summary`,
    },
  },
  httpClient: httpClientMock,
}));

const dto = {
  eventId: "evt-1",
  eventTitle: "Assembleia",
  ticketPrice: "25.00",
  totals: {
    totalPassengers: 48,
    totalExpected: "1075.00",
    totalReceived: "625.00",
    totalPending: "450.00",
    byStatus: { paid: 20, partial: 8, pending: 15, exempt: 5 },
  },
  congregations: [
    {
      congregationId: "c1",
      congregationName: "Central",
      totalPassengers: 30,
      totalExpected: "675.00",
      totalReceived: "425.00",
      totalPending: "250.00",
      byStatus: { paid: 14, partial: 5, pending: 8, exempt: 3 },
    },
  ],
};

describe("fetchFinancialSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    httpClientMock.mockResolvedValue(dto);
  });

  it("chama o endpoint correto e mapeia o DTO para o model", async () => {
    const result = await fetchFinancialSummary("evt-1");

    expect(httpClientMock).toHaveBeenCalledWith("/events/evt-1/financial-summary");
    expect(result.eventTitle).toBe("Assembleia");
    expect(result.totals.totalPending).toBe("450.00");
    expect(result.congregations).toHaveLength(1);
    expect(result.congregations[0].congregationName).toBe("Central");
  });

  it("propaga erro do httpClient", async () => {
    httpClientMock.mockRejectedValue(new Error("Evento não encontrado"));

    await expect(fetchFinancialSummary("evt-x")).rejects.toThrow("Evento não encontrado");
  });
});
