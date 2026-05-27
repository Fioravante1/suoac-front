import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateEventPassengerDaysAction } from "./update-event-passenger-days-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    eventPassengers: {
      updateDays: (id: string) => `/event-passengers/${id}/days`,
    },
  },
  httpClient: httpClientMock,
}));

const mockResponse = {
  id: "ep-1",
  passenger: { id: "p-1", name: "João", rg: "12345678X", phone: null },
  totalAmount: "150.00",
  paidAmount: "0",
  paymentStatus: "PENDING",
  days: [],
};

describe("updateEventPassengerDaysAction", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue(mockResponse);
  });

  it("chama o endpoint de atualização de dias", async () => {
    const result = await updateEventPassengerDaysAction("ep-1", ["day-1", "day-2"]);

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/event-passengers/ep-1/days", {
      method: "PATCH",
      body: { dayIds: ["day-1", "day-2"] },
    });
  });

  it("retorna erro para id ausente", async () => {
    const result = await updateEventPassengerDaysAction("", ["day-1"]);

    expect(result).toEqual({ success: false, error: "Inscrição inválida." });
  });

  it("retorna erro para dayIds vazio", async () => {
    const result = await updateEventPassengerDaysAction("ep-1", []);

    expect(result).toEqual({ success: false, error: "Selecione pelo menos um dia." });
  });

  it("retorna erro quando httpClient lança exceção", async () => {
    httpClientMock.mockRejectedValue(new Error("Evento não está OPEN"));

    const result = await updateEventPassengerDaysAction("ep-1", ["day-1"]);

    expect(result).toEqual({ success: false, error: "Evento não está OPEN" });
  });
});
