import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPassengerAction } from "./create-passenger-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    passengers: {
      create: (congregationId: string) => `/congregations/${congregationId}/passengers`,
    },
  },
  httpClient: httpClientMock,
}));

describe("createPassengerAction", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue({ id: "passenger-1", name: "João Silva" });
  });

  it("cria passageiro com dados válidos", async () => {
    const values = { name: "João Silva", rg: "12345678X", phone: "11999999999" };
    const result = await createPassengerAction("congregation-1", values);

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/congregations/congregation-1/passengers", {
      method: "POST",
      body: { name: "João Silva", rg: "12345678X", phone: "11999999999", observations: undefined },
    });
  });

  it("retorna erro para congregação ausente", async () => {
    const result = await createPassengerAction("", { name: "João Silva", rg: "12345678X" });

    expect(result).toEqual({ success: false, error: "Congregação inválida." });
    expect(httpClientMock).not.toHaveBeenCalled();
  });

  it("retorna erro para dados inválidos", async () => {
    const result = await createPassengerAction("congregation-1", { name: "J", rg: "ABC" });

    expect(result).toEqual({ success: false, error: "Revise os campos destacados e tente novamente." });
    expect(httpClientMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando httpClient falha", async () => {
    httpClientMock.mockRejectedValue(new Error("Network error"));

    const result = await createPassengerAction("congregation-1", { name: "João Silva", rg: "12345678X" });

    expect(result).toEqual({ success: false, error: "Network error" });
  });
});
