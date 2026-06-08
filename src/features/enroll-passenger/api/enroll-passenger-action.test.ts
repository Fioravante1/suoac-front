import { beforeEach, describe, expect, it, vi } from "vitest";

import { enrollPassengerAction } from "./enroll-passenger-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    eventPassengers: {
      create: (eventId: string) => `/events/${eventId}/passengers`,
    },
  },
  httpClient: httpClientMock,
}));

const mockResponse = {
  id: "ep-1",
  passenger: { id: "p-1", name: "João", rg: "12345678X", phone: null },
  totalAmount: "75.00",
  paidAmount: "0",
  paymentStatus: "PENDING",
  exemptionReason: null,
  observations: null,
  eventId: "event-1",
  congregationId: "cong-1",
  registeredById: "user-1",
  createdAt: "2026-05-26T00:00:00.000Z",
  updatedAt: "2026-05-26T00:00:00.000Z",
  days: [],
};

describe("enrollPassengerAction", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue(mockResponse);
  });

  it("chama o endpoint de inscrição com passageiro existente", async () => {
    const result = await enrollPassengerAction("event-1", { passengerId: "p-1" });

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/events/event-1/passengers", {
      method: "POST",
      body: { passengerId: "p-1" },
    });
  });

  it("chama o endpoint de inscrição com passageiro inline", async () => {
    const result = await enrollPassengerAction("event-1", {
      name: "João",
      rg: "12345678X",
      phone: "11999999999",
    });

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/events/event-1/passengers", {
      method: "POST",
      body: { name: "João", rg: "12345678X", phone: "11999999999" },
    });
  });

  it("retorna erro para eventId ausente", async () => {
    const result = await enrollPassengerAction("", { passengerId: "p-1" });

    expect(result).toEqual({ success: false, error: "Evento inválido." });
  });

  it("retorna erro quando httpClient lança exceção", async () => {
    httpClientMock.mockRejectedValue(new Error("Passageiro já inscrito neste evento"));

    const result = await enrollPassengerAction("event-1", { passengerId: "p-1" });

    expect(result).toEqual({ success: false, error: "Passageiro já inscrito neste evento" });
  });

  it("chama o endpoint com payload contendo payment", async () => {
    const payload = {
      passengerId: "p-1",
      payment: {
        amount: 75.0,
        paidAt: "2026-01-15T03:00:00.000Z",
        observations: "Pagamento via Pix",
      },
    };

    const result = await enrollPassengerAction("event-1", payload);

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/events/event-1/passengers", {
      method: "POST",
      body: payload,
    });
  });
});
