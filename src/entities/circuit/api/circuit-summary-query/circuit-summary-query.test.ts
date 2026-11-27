import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ httpClient: vi.fn() }));
vi.mock("@/shared/api/http-client", () => ({
  httpClient: mocks.httpClient,
  endpoints: { circuits: { summary: (id: string) => `/circuits/${id}/summary` } },
}));
import { fetchCircuitSummary } from "./circuit-summary-query";
import { circuitSummaryOptions } from "./circuit-summary-options";

describe("resumo do circuito", () => {
  it("busca pela rota do circuito e usa cache isolado", async () => {
    const summary = { activeCongregationCount: 20, activeCoordinatorCount: 18, pendingInvitationCount: 2 };
    mocks.httpClient.mockResolvedValue(summary);
    expect(await circuitSummaryOptions("c1").queryFn()).toEqual(summary);
    expect(mocks.httpClient).toHaveBeenCalledWith("/circuits/c1/summary");
    expect(circuitSummaryOptions("c1").queryKey).toEqual(["suoac", "circuits", "summary", "c1"]);
    expect(circuitSummaryOptions("").enabled).toBe(false);
    expect(circuitSummaryOptions("c1").throwOnError).toBe(false);
  });

  it("propaga a falha para recuperação local", async () => {
    mocks.httpClient.mockRejectedValue(new Error("Falha de rede"));
    await expect(fetchCircuitSummary("c1")).rejects.toThrow("Falha de rede");
  });
});
