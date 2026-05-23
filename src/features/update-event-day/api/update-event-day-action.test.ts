import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_DAY_STATUSES, EVENT_STATUSES } from "@/entities/event";
import type { EventDay } from "@/entities/event-day";

import { updateEventDayAction } from "./update-event-day-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    eventDays: {
      update: (id: string) => `/event-days/${id}`,
    },
  },
  httpClient: httpClientMock,
}));

const updatedDay: EventDay = {
  id: "day-1",
  dayNumber: 1,
  date: "2026-07-10T00:00:00.000Z",
  label: "Dia 1 - Sexta-feira",
  departureTime: "07:00",
  returnTime: "18:00",
  status: "ACTIVE",
  eventId: "event-1",
};

const original = { departureTime: "06:00", returnTime: "18:00" };

describe("updateEventDayAction", () => {
  beforeEach(() => {
    httpClientMock.mockClear();
    httpClientMock.mockResolvedValue(updatedDay);
  });

  it("chama o endpoint de atualização quando há alteração", async () => {
    const result = await updateEventDayAction(
      "day-1",
      EVENT_STATUSES.DRAFT,
      EVENT_DAY_STATUSES.ACTIVE,
      { departureTime: "07:00", returnTime: "18:00" },
      original,
    );

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/event-days/day-1", {
      method: "PATCH",
      body: { departureTime: "07:00" },
    });
  });

  it("retorna erro quando dia está cancelado", async () => {
    const result = await updateEventDayAction(
      "day-1",
      EVENT_STATUSES.DRAFT,
      EVENT_DAY_STATUSES.CANCELLED,
      { departureTime: "07:00", returnTime: "18:00" },
      original,
    );

    expect(result).toEqual({ success: false, error: "Os horários deste dia não podem ser alterados." });
    expect(httpClientMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando evento está finalizado", async () => {
    const result = await updateEventDayAction(
      "day-1",
      EVENT_STATUSES.FINISHED,
      EVENT_DAY_STATUSES.ACTIVE,
      { departureTime: "07:00", returnTime: "18:00" },
      original,
    );

    expect(result).toEqual({ success: false, error: "Os horários deste dia não podem ser alterados." });
    expect(httpClientMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando nenhum campo foi alterado", async () => {
    const result = await updateEventDayAction(
      "day-1",
      EVENT_STATUSES.DRAFT,
      EVENT_DAY_STATUSES.ACTIVE,
      { departureTime: "06:00", returnTime: "18:00" },
      original,
    );

    expect(result).toEqual({ success: false, error: "Nenhuma alteração detectada." });
    expect(httpClientMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando dayId é vazio", async () => {
    const result = await updateEventDayAction(
      "",
      EVENT_STATUSES.DRAFT,
      EVENT_DAY_STATUSES.ACTIVE,
      { departureTime: "07:00", returnTime: "18:00" },
      original,
    );

    expect(result).toEqual({ success: false, error: "Dia inválido." });
  });

  it("retorna erro ao falhar a requisição", async () => {
    httpClientMock.mockRejectedValue(new Error("Network error"));

    const result = await updateEventDayAction(
      "day-1",
      EVENT_STATUSES.DRAFT,
      EVENT_DAY_STATUSES.ACTIVE,
      { departureTime: "07:00", returnTime: "18:00" },
      original,
    );

    expect(result).toEqual({ success: false, error: "Network error" });
  });
});
