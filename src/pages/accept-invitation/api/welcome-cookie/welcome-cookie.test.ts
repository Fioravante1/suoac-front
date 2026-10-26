import { beforeEach, describe, expect, it, vi } from "vitest";

import { routes } from "@/shared/config";

const set = vi.fn();
const get = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: (...args: unknown[]) => set(...args), get: (...args: unknown[]) => get(...args) }),
}));

const { readWelcomeSummary, saveWelcomeSummary } = await import("./welcome-cookie");

const SUMMARY = {
  name: "Maria Souza",
  email: "maria@example.com",
  role: "CONGREGATION_COORDINATOR",
  invitedBy: "Marcos Oliveira",
  circuit: "SP-17",
  circuitCity: "Campinas",
  circuitState: "SP",
  congregation: "Jardim Paulista",
  congregationCode: "31245",
};

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

beforeEach(() => {
  set.mockReset();
  get.mockReset();
});

describe("saveWelcomeSummary", () => {
  it("guarda o resumo por poucos minutos, só para a rota do aceite e fora do alcance de JavaScript", async () => {
    await saveWelcomeSummary(SUMMARY);

    expect(set).toHaveBeenCalledWith(
      "suoac-invitation-welcome",
      encode(SUMMARY),
      expect.objectContaining({ httpOnly: true, path: routes.acceptInvitation, maxAge: 300, sameSite: "lax" }),
    );
  });
});

describe("readWelcomeSummary", () => {
  it("devolve o resumo guardado", async () => {
    get.mockReturnValue({ value: encode(SUMMARY) });

    await expect(readWelcomeSummary()).resolves.toEqual(SUMMARY);
  });

  it("devolve nulo quando não há cookie, como depois dos cinco minutos", async () => {
    get.mockReturnValue(undefined);

    await expect(readWelcomeSummary()).resolves.toBeNull();
  });

  it("devolve nulo quando o cookie está corrompido", async () => {
    get.mockReturnValue({ value: "isto-nao-e-base64-de-json" });

    await expect(readWelcomeSummary()).resolves.toBeNull();
  });

  it("devolve nulo quando o conteúdo não tem o formato do resumo", async () => {
    get.mockReturnValue({ value: encode({ name: "Maria" }) });

    await expect(readWelcomeSummary()).resolves.toBeNull();
  });
});
