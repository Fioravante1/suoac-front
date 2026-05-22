import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteEventAction } from "./delete-event-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    events: {
      delete: (id: string) => `/events/${id}`,
    },
  },
  httpClient: httpClientMock,
}));

describe("deleteEventAction", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue(undefined);
  });

  it("chama o endpoint de exclusão do evento", async () => {
    const result = await deleteEventAction("event-1");

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/events/event-1", { method: "DELETE" });
  });

  it("retorna erro para id ausente", async () => {
    const result = await deleteEventAction("");

    expect(result).toEqual({ success: false, error: "Evento inválido." });
  });
});
