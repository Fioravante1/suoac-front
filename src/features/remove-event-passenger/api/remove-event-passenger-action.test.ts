import { beforeEach, describe, expect, it, vi } from "vitest";

import { removeEventPassengerAction } from "./remove-event-passenger-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    eventPassengers: {
      delete: (id: string) => `/event-passengers/${id}`,
    },
  },
  httpClient: httpClientMock,
}));

describe("removeEventPassengerAction", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue(undefined);
  });

  it("chama o endpoint de remoção da inscrição", async () => {
    const result = await removeEventPassengerAction("ep-1");

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/event-passengers/ep-1", { method: "DELETE" });
  });

  it("retorna erro para id ausente", async () => {
    const result = await removeEventPassengerAction("");

    expect(result).toEqual({ success: false, error: "Inscrição inválida." });
  });

  it("retorna erro quando httpClient lança exceção", async () => {
    httpClientMock.mockRejectedValue(new Error("Evento não está OPEN"));

    const result = await removeEventPassengerAction("ep-1");

    expect(result).toEqual({ success: false, error: "Evento não está OPEN" });
  });
});
