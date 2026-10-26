import { beforeEach, describe, expect, it, vi } from "vitest";

import { endpoints, HttpError } from "@/shared/api/http-client";

const httpClient = vi.fn();

vi.mock("@/shared/api/http-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/http-client")>()),
  httpClient: (...args: unknown[]) => httpClient(...args),
}));

const { requestPasswordResetAction } = await import("./request-password-reset-action");

const EMAIL = "coordenador@circuito.org";

beforeEach(() => {
  httpClient.mockReset();
});

describe("requestPasswordResetAction", () => {
  it("solicita o link para um e-mail válido", async () => {
    httpClient.mockResolvedValue(undefined);

    const result = await requestPasswordResetAction({ email: EMAIL });

    expect(httpClient).toHaveBeenCalledWith(endpoints.auth.passwordResetRequests, {
      method: "POST",
      body: { email: EMAIL },
    });
    expect(result).toEqual({ status: "success" });
  });

  it("não toca a API quando o e-mail é inválido", async () => {
    const result = await requestPasswordResetAction({ email: "nao-e-email" });

    expect(httpClient).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "error", message: "Informe um e-mail válido." });
  });

  it("orienta a aguardar quando há tentativas demais", async () => {
    httpClient.mockRejectedValue(new HttpError(429, "Too Many Requests"));

    const result = await requestPasswordResetAction({ email: EMAIL });

    expect(result).toEqual({
      status: "error",
      message: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
    });
  });

  it("oferece recuperação quando a solicitação falha", async () => {
    httpClient.mockRejectedValue(new Error("rede fora do ar"));

    const result = await requestPasswordResetAction({ email: EMAIL });

    expect(result).toEqual({
      status: "error",
      message: "Não foi possível enviar o link agora. Verifique sua conexão e tente novamente.",
    });
  });
});
