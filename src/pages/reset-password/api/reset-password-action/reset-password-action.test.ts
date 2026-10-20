import { beforeEach, describe, expect, it, vi } from "vitest";

import { endpoints, HttpError } from "@/shared/api/http-client";

const httpClient = vi.fn();
const deleteSession = vi.fn();
const redirect = vi.fn((url: string) => {
  // `redirect` sinaliza por excecao no Next; o teste imita isso para provar
  // que nada roda depois dele e que o `catch` da action nao o engole.
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
}));

vi.mock("@/shared/api/http-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/http-client")>()),
  httpClient: (...args: unknown[]) => httpClient(...args),
}));

vi.mock("@/shared/auth/session", () => ({
  deleteSession: () => deleteSession(),
}));

const { resetPasswordAction } = await import("./reset-password-action");

const TOKEN = "token-do-link";
const SENHA = "NovaSenha123";

const entradaValida = { token: TOKEN, newPassword: SENHA, confirmPassword: SENHA };

beforeEach(() => {
  httpClient.mockReset();
  deleteSession.mockReset();
  redirect.mockClear();
});

describe("resetPasswordAction", () => {
  it("redefine a senha enviando token e senha no corpo", async () => {
    httpClient.mockResolvedValue(undefined);

    await expect(resetPasswordAction(entradaValida)).rejects.toThrow("NEXT_REDIRECT");

    expect(httpClient).toHaveBeenCalledWith(endpoints.auth.passwordResets, {
      method: "POST",
      body: { token: TOKEN, newPassword: SENHA },
    });
  });

  it("leva para a confirmação sem o token na URL", async () => {
    /*
     * Nao devolve `success` para a tela guardar: apagar o cookie faz o Next
     * re-renderizar a rota, que reavaliaria o token ja consumido e trocaria o
     * sucesso por "link ja usado".
     */
    httpClient.mockResolvedValue(undefined);

    await expect(resetPasswordAction(entradaValida)).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/reset-password?status=sucesso");
    expect(redirect.mock.calls[0]?.[0]).not.toContain(TOKEN);
  });

  it("apaga o cookie de sessão deste navegador ao redefinir", async () => {
    // O backend revoga todas as sessoes do usuario. Cookie sobrevivente faz o
    // `routeGuard` mandar para o painel quem vai para `/login` — em computador
    // compartilhado, o painel de outra pessoa.
    httpClient.mockResolvedValue(undefined);

    await expect(resetPasswordAction(entradaValida)).rejects.toThrow("NEXT_REDIRECT");

    expect(deleteSession).toHaveBeenCalledTimes(1);
  });

  it("preserva a sessão quando a redefinição falha", async () => {
    httpClient.mockRejectedValue(new HttpError(410, "expirado"));

    await resetPasswordAction(entradaValida);

    expect(deleteSession).not.toHaveBeenCalled();
  });

  it("não envia a confirmação para a API", async () => {
    httpClient.mockResolvedValue(undefined);

    await expect(resetPasswordAction(entradaValida)).rejects.toThrow("NEXT_REDIRECT");

    const [, options] = httpClient.mock.calls[0] as [string, { body: Record<string, unknown> }];

    expect(options.body).not.toHaveProperty("confirmPassword");
  });

  it("barra senha fora da política antes de tocar a API", async () => {
    const result = await resetPasswordAction({
      ...entradaValida,
      newPassword: "senhalonga",
      confirmPassword: "senhalonga",
    });

    expect(httpClient).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "error", message: "Revise a senha e a confirmação." });
  });

  it("barra confirmação divergente antes de tocar a API", async () => {
    const result = await resetPasswordAction({ ...entradaValida, confirmPassword: "OutraSenha123" });

    expect(httpClient).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "error", message: "Revise a senha e a confirmação." });
  });

  it("recusa link sem token sem tocar a API", async () => {
    const result = await resetPasswordAction({ ...entradaValida, token: "" });

    expect(httpClient).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "token-rejected", tokenState: "invalid" });
  });

  it("devolve o estado do token quando ele é recusado no submit", async () => {
    const casos = [
      { status: 410, esperado: "expired" },
      { status: 409, esperado: "used" },
      { status: 400, esperado: "invalid" },
    ] as const;

    for (const caso of casos) {
      httpClient.mockRejectedValueOnce(new HttpError(caso.status, "recusado"));

      await expect(resetPasswordAction(entradaValida)).resolves.toEqual({
        status: "token-rejected",
        tokenState: caso.esperado,
      });
    }
  });

  it("orienta a aguardar quando há tentativas demais", async () => {
    httpClient.mockRejectedValue(new HttpError(429, "Too Many Requests"));

    const result = await resetPasswordAction(entradaValida);

    expect(result).toEqual({
      status: "error",
      message: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
    });
  });

  it("oferece nova tentativa quando a falha é do serviço", async () => {
    httpClient.mockRejectedValue(new Error("rede fora do ar"));

    const result = await resetPasswordAction(entradaValida);

    expect(result).toEqual({
      status: "error",
      message: "Não foi possível redefinir a senha agora. Verifique sua conexão e tente novamente.",
    });
  });
});
