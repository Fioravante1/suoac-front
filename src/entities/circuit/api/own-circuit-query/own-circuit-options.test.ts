import { describe, expect, it, vi } from "vitest";

const fetchOwnCircuitMock = vi.hoisted(() => vi.fn());

vi.mock("./own-circuit-query", () => ({ fetchOwnCircuit: fetchOwnCircuitMock }));

import { ownCircuitOptions } from "./own-circuit-options";

describe("ownCircuitOptions", () => {
  it("guarda o circuito no cache pela chave do circuito da sessão", () => {
    expect(ownCircuitOptions("circuit-1").queryKey).toEqual(["suoac", "circuits", "own", "circuit-1"]);
  });

  it("busca o circuito da sessão", async () => {
    fetchOwnCircuitMock.mockResolvedValue({ id: "circuit-1" });

    await ownCircuitOptions("circuit-1").queryFn();

    expect(fetchOwnCircuitMock).toHaveBeenCalledOnce();
  });

  it("deixa a falha com quem consome, sem levá-la à error boundary", () => {
    expect(ownCircuitOptions("circuit-1").throwOnError).toBe(false);
  });

  it("não busca sem circuito na sessão", () => {
    expect(ownCircuitOptions("").enabled).toBe(false);
  });
});
