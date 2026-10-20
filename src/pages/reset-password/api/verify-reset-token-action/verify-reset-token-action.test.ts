import { beforeEach, describe, expect, it, vi } from "vitest";

import { endpoints, HttpError } from "@/shared/api/http-client";

const httpClient = vi.fn();

vi.mock("@/shared/api/http-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/http-client")>()),
  httpClient: (...args: unknown[]) => httpClient(...args),
}));

const { verifyResetTokenAction } = await import("./verify-reset-token-action");

const TOKEN = "token-do-link";

beforeEach(() => {
  httpClient.mockReset();
});

describe("verifyResetTokenAction", () => {
  it("envia o token no corpo, nunca na query string", async () => {
    httpClient.mockResolvedValue(undefined);

    const state = await verifyResetTokenAction(TOKEN);

    expect(httpClient).toHaveBeenCalledWith(endpoints.auth.passwordResetVerifications, {
      method: "POST",
      body: { token: TOKEN },
    });
    expect(state).toBe("valid");
  });

  it("não toca a API quando o link vem sem token", async () => {
    const state = await verifyResetTokenAction("");

    expect(httpClient).not.toHaveBeenCalled();
    expect(state).toBe("invalid");
  });

  it("distingue expirado, usado e inválido pelos códigos do contrato", async () => {
    const casos = [
      { status: 410, esperado: "expired" },
      { status: 409, esperado: "used" },
      { status: 400, esperado: "invalid" },
    ] as const;

    for (const caso of casos) {
      httpClient.mockRejectedValueOnce(new HttpError(caso.status, "recusado"));

      await expect(verifyResetTokenAction(TOKEN)).resolves.toBe(caso.esperado);
    }
  });

  it("não culpa o token quando a falha é do serviço", async () => {
    // 500 e queda de rede não são veredito sobre o link: dizer "inválido" aqui
    // mandaria a pessoa pedir outro link sem motivo.
    httpClient.mockRejectedValueOnce(new HttpError(500, "Internal Server Error"));
    await expect(verifyResetTokenAction(TOKEN)).resolves.toBe("unavailable");

    httpClient.mockRejectedValueOnce(new Error("rede fora do ar"));
    await expect(verifyResetTokenAction(TOKEN)).resolves.toBe("unavailable");
  });
});
