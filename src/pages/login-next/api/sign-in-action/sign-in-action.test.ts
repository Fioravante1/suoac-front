import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/shared/api/http-client";

const httpClient = vi.fn();
const createSession = vi.fn();

vi.mock("@/shared/api/http-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/http-client")>()),
  httpClient: (...args: unknown[]) => httpClient(...args),
}));

vi.mock("@/shared/auth/session", () => ({
  createSession: (...args: unknown[]) => createSession(...args),
  toSessionLifetime: (response: { extendedSession?: boolean; refreshExpiresIn?: number }) => ({
    extended: response.extendedSession === true,
    refreshExpiresIn: response.refreshExpiresIn ?? 604800,
  }),
}));

const { signInAction } = await import("./sign-in-action");

const CREDENTIALS = { email: "coordenador@circuito.org", password: "senha-correta", rememberMe: false };

function givenBackendAccepts(
  name = "Fioravante Chiozzi",
  mustChangePassword = false,
  lifetime: { extendedSession: boolean; refreshExpiresIn: number } = {
    extendedSession: false,
    refreshExpiresIn: 604800,
  },
) {
  httpClient.mockResolvedValue({
    accessToken: "token-de-acesso",
    refreshToken: "token-de-renovacao",
    ...lifetime,
    user: {
      id: "1",
      name,
      email: CREDENTIALS.email,
      role: "CIRCUIT_COORDINATOR",
      isActive: true,
      circuitId: "c1",
      congregationId: null,
      mustChangePassword,
    },
  });
}

beforeEach(() => {
  httpClient.mockReset();
  createSession.mockReset();
});

describe("signInAction", () => {
  it("abre a sessão e devolve o primeiro nome de quem entrou", async () => {
    givenBackendAccepts("Fioravante Chiozzi");

    const result = await signInAction(CREDENTIALS);

    expect(createSession).toHaveBeenCalledWith(
      "token-de-acesso",
      "token-de-renovacao",
      expect.objectContaining({ email: CREDENTIALS.email }),
      { extended: false, refreshExpiresIn: 604800 },
    );
    expect(result).toEqual({ status: "success", firstName: "Fioravante", redirectTo: "/dashboard" });
  });

  it("pede a sessão estendida ao backend e grava o cookie pelo tempo que ele informa", async () => {
    givenBackendAccepts("Fioravante Chiozzi", false, { extendedSession: true, refreshExpiresIn: 2592000 });

    await signInAction({ ...CREDENTIALS, rememberMe: true });

    expect(httpClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: { email: CREDENTIALS.email, password: CREDENTIALS.password, rememberMe: true },
      }),
    );
    expect(createSession).toHaveBeenCalledWith(
      "token-de-acesso",
      "token-de-renovacao",
      expect.objectContaining({ email: CREDENTIALS.email }),
      { extended: true, refreshExpiresIn: 2592000 },
    );
  });

  it("devolve ao usuário a tela de onde ele foi barrado", async () => {
    givenBackendAccepts();

    const result = await signInAction({ ...CREDENTIALS, returnUrl: "/passengers?page=3" });

    expect(result).toEqual(expect.objectContaining({ redirectTo: "/passengers?page=3" }));
  });

  it("recusa destino externo, para a tela de entrada não despachar ninguém para fora", async () => {
    givenBackendAccepts();

    const result = await signInAction({ ...CREDENTIALS, returnUrl: "//site-externo.com/phishing" });

    expect(result).toEqual(expect.objectContaining({ redirectTo: "/dashboard" }));
  });

  it("manda trocar a senha provisória antes de qualquer outro destino", async () => {
    givenBackendAccepts("Fioravante", true);

    const result = await signInAction({ ...CREDENTIALS, returnUrl: "/financial" });

    expect(result).toEqual(expect.objectContaining({ redirectTo: "/change-password" }));
  });

  it("explica credencial inválida em português, sem código de status", async () => {
    httpClient.mockRejectedValue(new HttpError(401, "Unauthorized"));

    const result = await signInAction(CREDENTIALS);

    expect(result).toEqual({ status: "error", message: "E-mail ou senha incorretos." });
    expect(createSession).not.toHaveBeenCalled();
  });

  it("oferece caminho de recuperação quando a falha não é de credencial", async () => {
    httpClient.mockRejectedValue(new Error("rede fora do ar"));

    const result = await signInAction(CREDENTIALS);

    expect(result).toEqual({
      status: "error",
      message: "Não foi possível entrar agora. Verifique sua conexão e tente novamente.",
    });
  });

  it("não chega a chamar a API com dados que já são inválidos", async () => {
    const result = await signInAction({ email: "nao-e-email", password: "123", rememberMe: false });

    expect(httpClient).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "error", message: "Dados inválidos. Confira o e-mail e a senha." });
  });
});
