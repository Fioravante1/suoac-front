import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPayments } from "./payment.queries";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    payments: {
      list: (eventPassengerId: string) => `/event-passengers/${eventPassengerId}/payments`,
    },
  },
  httpClient: httpClientMock,
}));

const mockPayments = [
  {
    id: "pay-1",
    amount: "50",
    paidAt: "2026-02-01T10:00:00.000Z",
    observations: "Pix",
    eventPassengerId: "ep-1",
    registeredById: "user-1",
    createdAt: "2026-02-01T10:00:00.000Z",
  },
  {
    id: "pay-2",
    amount: "25",
    paidAt: "2026-01-15T10:00:00.000Z",
    observations: null,
    eventPassengerId: "ep-1",
    registeredById: "user-1",
    createdAt: "2026-01-15T10:00:00.000Z",
  },
];

describe("fetchPayments", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue(mockPayments);
  });

  it("chama o endpoint correto e retorna a lista de pagamentos", async () => {
    const result = await fetchPayments("ep-1");

    expect(httpClientMock).toHaveBeenCalledWith("/event-passengers/ep-1/payments");
    expect(result).toEqual(mockPayments);
  });

  it("propaga erro do httpClient", async () => {
    httpClientMock.mockRejectedValue(new Error("Inscrição não encontrada"));

    await expect(fetchPayments("ep-invalid")).rejects.toThrow("Inscrição não encontrada");
  });
});
