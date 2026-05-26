import { beforeEach, describe, expect, it, vi } from "vitest";

import { deletePassengerAction } from "./delete-passenger-action";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    passengers: {
      delete: (id: string) => `/passengers/${id}`,
    },
  },
  httpClient: httpClientMock,
}));

describe("deletePassengerAction", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue(undefined);
  });

  it("exclui passageiro com sucesso", async () => {
    const result = await deletePassengerAction("passenger-1");

    expect(result.success).toBe(true);
    expect(httpClientMock).toHaveBeenCalledWith("/passengers/passenger-1", { method: "DELETE" });
  });

  it("retorna erro para id ausente", async () => {
    const result = await deletePassengerAction("");

    expect(result).toEqual({ success: false, error: "Passageiro inválido." });
    expect(httpClientMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando passageiro tem inscrições", async () => {
    httpClientMock.mockRejectedValue(
      new Error("Não é possível remover um passageiro que possui inscrições em eventos"),
    );

    const result = await deletePassengerAction("passenger-1");

    expect(result).toEqual({
      success: false,
      error: "Não é possível remover um passageiro que possui inscrições em eventos",
    });
  });
});
