import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Event } from "@/entities/event";

import { cancelEventAction } from "./cancel-event-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    events: {
      cancel: (id: string) => `/events/${id}/cancel`,
    },
  },
  httpClient: httpClientMock,
}));

const cancelledEvent: Event = {
  id: "event-1",
  title: "Assembleia SP 2026",
  type: "ASSEMBLY",
  ticketPrice: "25.00",
  status: "CANCELLED",
  registrationDeadline: "2026-06-01T00:00:00.000Z",
  paymentDeadline: "2026-06-15T00:00:00.000Z",
  venue: "Salão Central",
  address: "Rua das Flores, 100",
  city: "São Paulo",
  state: "SP",
  observations: null,
  circuitId: "circuit-1",
  createdById: "user-1",
  createdAt: "2026-05-21T00:00:00.000Z",
  updatedAt: "2026-05-21T00:00:00.000Z",
};

describe("cancelEventAction", () => {
  beforeEach(() => {
    httpClientMock.mockClear();
    httpClientMock.mockResolvedValue(cancelledEvent);
  });

  it("chama o endpoint de cancelamento sem body", async () => {
    const result = await cancelEventAction("event-1");

    expect(result).toEqual({ success: true, data: cancelledEvent });
    expect(httpClientMock).toHaveBeenCalledWith("/events/event-1/cancel", {
      method: "PATCH",
    });
  });

  it("retorna erro quando eventId é vazio", async () => {
    const result = await cancelEventAction("");

    expect(result).toEqual({ success: false, error: "Evento inválido." });
    expect(httpClientMock).not.toHaveBeenCalled();
  });

  it("retorna erro ao falhar a requisição", async () => {
    httpClientMock.mockRejectedValue(new Error("Network error"));

    const result = await cancelEventAction("event-1");

    expect(result).toEqual({ success: false, error: "Network error" });
  });

  it("retorna mensagem padrão para erro desconhecido", async () => {
    httpClientMock.mockRejectedValue("unknown");

    const result = await cancelEventAction("event-1");

    expect(result).toEqual({ success: false, error: "Não foi possível cancelar o evento." });
  });
});
