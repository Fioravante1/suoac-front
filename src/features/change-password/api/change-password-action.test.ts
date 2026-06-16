import { describe, it, expect, vi, beforeEach } from "vitest";

import { SESSION_EXPIRED_MESSAGE } from "@/shared/auth";

const { httpClientMock, createSessionMock, redirectMock, HttpError } = vi.hoisted(() => {
  class HttpError extends Error {
    constructor(
      public readonly status: number,
      message: string,
    ) {
      super(message);
      this.name = "HttpError";
    }
  }

  return {
    httpClientMock: vi.fn(),
    createSessionMock: vi.fn(),
    redirectMock: vi.fn(),
    HttpError,
  };
});

vi.mock("@/shared/api/http-client", () => ({
  httpClient: (...args: unknown[]) => httpClientMock(...args),
  HttpError,
  endpoints: { auth: { changePassword: "/auth/change-password" } },
}));

vi.mock("@/shared/auth/session", () => ({
  createSession: (...args: unknown[]) => createSessionMock(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

import { changePasswordAction } from "./change-password-action";

function formDataOf(values: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

const validInput = {
  currentPassword: "80275@Suoac",
  newPassword: "NovaSenhaForte123",
  confirmPassword: "NovaSenhaForte123",
};

const userResponse = {
  id: "u1",
  name: "Coordenador",
  email: "coord@suoac.dev",
  role: "CONGREGATION_COORDINATOR",
  isActive: true,
  circuitId: "c1",
  congregationId: "g1",
  mustChangePassword: false,
};

describe("changePasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia ao endpoint correto, troca a sessão e redireciona para o dashboard", async () => {
    httpClientMock.mockResolvedValue({ accessToken: "novo-a", refreshToken: "novo-r", user: userResponse });

    await changePasswordAction(undefined, formDataOf(validInput));

    expect(httpClientMock).toHaveBeenCalledWith("/auth/change-password", {
      method: "POST",
      body: { currentPassword: "80275@Suoac", newPassword: "NovaSenhaForte123" },
    });
    expect(createSessionMock).toHaveBeenCalledWith(
      "novo-a",
      "novo-r",
      expect.objectContaining({ id: "u1", mustChangePassword: false }),
    );
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("não envia o confirmPassword ao backend", async () => {
    httpClientMock.mockResolvedValue({ accessToken: "a", refreshToken: "r", user: userResponse });

    await changePasswordAction(undefined, formDataOf(validInput));

    const [, options] = httpClientMock.mock.calls[0] as [string, { body: Record<string, unknown> }];
    expect(options.body).not.toHaveProperty("confirmPassword");
  });

  it("retorna erro genérico e não chama o backend com dados inválidos", async () => {
    const result = await changePasswordAction(
      undefined,
      formDataOf({ currentPassword: "x", newPassword: "curta", confirmPassword: "curta" }),
    );

    expect(result.error).toMatch(/Dados inválidos/);
    expect(httpClientMock).not.toHaveBeenCalled();
  });

  it("mapeia 401 de senha atual para o campo currentPassword", async () => {
    httpClientMock.mockRejectedValue(new HttpError(401, "Senha atual incorreta"));

    const result = await changePasswordAction(undefined, formDataOf(validInput));

    expect(result).toEqual({ field: "currentPassword", error: "Senha atual incorreta." });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("trata 401 de credenciais inválidas como sessão expirada", async () => {
    httpClientMock.mockRejectedValue(new HttpError(401, "Credenciais invalidas"));

    const result = await changePasswordAction(undefined, formDataOf(validInput));

    expect(result).toEqual({ error: SESSION_EXPIRED_MESSAGE });
  });

  it("propaga a sessão expirada vinda do http-client", async () => {
    httpClientMock.mockRejectedValue(new HttpError(401, SESSION_EXPIRED_MESSAGE));

    const result = await changePasswordAction(undefined, formDataOf(validInput));

    expect(result).toEqual({ error: SESSION_EXPIRED_MESSAGE });
  });

  it("mapeia 422 para o campo newPassword", async () => {
    httpClientMock.mockRejectedValue(new HttpError(422, "A nova senha deve ser diferente da atual"));

    const result = await changePasswordAction(undefined, formDataOf(validInput));

    expect(result).toEqual({ field: "newPassword", error: "A nova senha deve ser diferente da atual." });
  });

  it("mapeia 400 para erro de formulário", async () => {
    httpClientMock.mockRejectedValue(new HttpError(400, "Bad request"));

    const result = await changePasswordAction(undefined, formDataOf(validInput));

    expect(result).toEqual({ error: "Verifique os campos e tente novamente." });
  });

  it("retorna erro genérico para falhas inesperadas", async () => {
    httpClientMock.mockRejectedValue(new Error("network"));

    const result = await changePasswordAction(undefined, formDataOf(validInput));

    expect(result).toEqual({ error: "Não foi possível alterar a senha. Tente novamente." });
  });
});
