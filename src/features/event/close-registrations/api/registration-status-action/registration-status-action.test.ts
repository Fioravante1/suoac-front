import { beforeEach, describe, expect, it, vi } from "vitest";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: { events: { updateStatus: (id: string) => `/events/${id}/status` } },
  httpClient: httpClientMock,
}));

import { EVENT_STATUSES } from "@/entities/event";

import { closeRegistrationsAction, reopenRegistrationsAction } from "./registration-status-action";

describe("closeRegistrationsAction", () => {
  beforeEach(() => {
    httpClientMock.mockReset();
  });

  it("troca o status do evento para encerrado", async () => {
    httpClientMock.mockResolvedValue({ id: "event-1", status: EVENT_STATUSES.CLOSED });

    const result = await closeRegistrationsAction("event-1");

    expect(result).toEqual({ success: true, data: { id: "event-1", status: EVENT_STATUSES.CLOSED } });
    expect(httpClientMock).toHaveBeenCalledWith("/events/event-1/status", {
      method: "PATCH",
      body: { status: EVENT_STATUSES.CLOSED },
    });
  });

  it("devolve a mensagem da API quando a troca é recusada", async () => {
    httpClientMock.mockRejectedValue(new Error("Transição inválida: CLOSED → CLOSED"));

    expect(await closeRegistrationsAction("event-1")).toEqual({
      success: false,
      error: "Transição inválida: CLOSED → CLOSED",
    });
  });

  it("recusa sem evento, sem chamar a API", async () => {
    expect(await closeRegistrationsAction("")).toEqual({ success: false, error: "Evento inválido." });
    expect(httpClientMock).not.toHaveBeenCalled();
  });
});

describe("reopenRegistrationsAction", () => {
  beforeEach(() => {
    httpClientMock.mockReset();
  });

  it("troca o status do evento de volta para aberto", async () => {
    httpClientMock.mockResolvedValue({ id: "event-1", status: EVENT_STATUSES.OPEN });

    await reopenRegistrationsAction("event-1");

    expect(httpClientMock).toHaveBeenCalledWith("/events/event-1/status", {
      method: "PATCH",
      body: { status: EVENT_STATUSES.OPEN },
    });
  });

  it("usa a mensagem própria quando a falha não traz texto", async () => {
    httpClientMock.mockRejectedValue("rede");

    expect(await reopenRegistrationsAction("event-1")).toEqual({
      success: false,
      error: "Não foi possível reabrir as inscrições.",
    });
  });
});
