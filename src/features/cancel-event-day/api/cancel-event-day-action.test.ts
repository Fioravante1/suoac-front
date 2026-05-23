import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventDay } from "@/entities/event-day";

import { cancelEventDayAction } from "./cancel-event-day-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    eventDays: {
      cancel: (id: string) => `/event-days/${id}/cancel`,
    },
  },
  httpClient: httpClientMock,
}));

const cancelledDay: EventDay = {
  id: "day-1",
  dayNumber: 1,
  date: "2026-07-10T00:00:00.000Z",
  label: "Dia 1 - Sexta-feira",
  departureTime: "06:00",
  returnTime: "18:00",
  status: "CANCELLED",
  eventId: "event-1",
};

describe("cancelEventDayAction", () => {
  beforeEach(() => {
    httpClientMock.mockClear();
    httpClientMock.mockResolvedValue(cancelledDay);
  });

  it("chama o endpoint de cancelamento", async () => {
    const result = await cancelEventDayAction("day-1");

    expect(result).toEqual({ success: true, data: cancelledDay });
    expect(httpClientMock).toHaveBeenCalledWith("/event-days/day-1/cancel", { method: "PATCH" });
  });

  it("retorna erro quando dayId é vazio", async () => {
    const result = await cancelEventDayAction("");

    expect(result).toEqual({ success: false, error: "Dia inválido." });
    expect(httpClientMock).not.toHaveBeenCalled();
  });

  it("retorna erro ao falhar a requisição", async () => {
    httpClientMock.mockRejectedValue(new Error("Network error"));

    const result = await cancelEventDayAction("day-1");

    expect(result).toEqual({ success: false, error: "Network error" });
  });
});
