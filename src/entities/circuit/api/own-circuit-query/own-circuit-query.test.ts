import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchOwnCircuit } from "./own-circuit-query";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: { circuits: { own: "/circuits/me" } },
  httpClient: httpClientMock,
}));

const circuit = { id: "circuit-1", name: "SP-17", city: "Campinas", state: "SP" };

describe("fetchOwnCircuit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta o circuito da sessão e o retorna", async () => {
    httpClientMock.mockResolvedValue(circuit);

    const result = await fetchOwnCircuit();

    expect(httpClientMock).toHaveBeenCalledWith("/circuits/me");
    expect(result).toEqual(circuit);
  });

  it("propaga a falha da API", async () => {
    httpClientMock.mockRejectedValue(new Error("Network error"));

    await expect(fetchOwnCircuit()).rejects.toThrow("Network error");
  });
});
