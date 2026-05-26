import { beforeEach, describe, expect, it, vi } from "vitest";

import { updatePassengerAction } from "./update-passenger-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    passengers: {
      update: (id: string) => `/passengers/${id}`,
    },
  },
  httpClient: httpClientMock,
}));

describe("updatePassengerAction", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue({ id: "passenger-1", name: "João Atualizado" });
  });

  it("atualiza passageiro com dados válidos", async () => {
    const values = { name: "João Atualizado", rg: "12345678X" };
    const result = await updatePassengerAction("passenger-1", values);

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/passengers/passenger-1", {
      method: "PATCH",
      body: { name: "João Atualizado", rg: "12345678X", phone: undefined, observations: undefined },
    });
  });

  it("retorna erro para id ausente", async () => {
    const result = await updatePassengerAction("", { name: "João Silva", rg: "12345678X" });

    expect(result).toEqual({ success: false, error: "Passageiro inválido." });
    expect(httpClientMock).not.toHaveBeenCalled();
  });

  it("retorna erro para dados inválidos", async () => {
    const result = await updatePassengerAction("passenger-1", { name: "J", rg: "ABC" });

    expect(result).toEqual({ success: false, error: "Revise os campos destacados e tente novamente." });
    expect(httpClientMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando httpClient falha", async () => {
    httpClientMock.mockRejectedValue(new Error("Conflict"));

    const result = await updatePassengerAction("passenger-1", { name: "João Silva", rg: "12345678X" });

    expect(result).toEqual({ success: false, error: "Conflict" });
  });
});
