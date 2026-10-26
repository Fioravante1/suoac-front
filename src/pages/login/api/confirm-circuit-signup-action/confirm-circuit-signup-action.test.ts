import { beforeEach, describe, expect, it, vi } from "vitest";

import { endpoints } from "@/shared/api/http-client";

const httpClientRaw = vi.fn();
const createSession = vi.fn();

vi.mock("@/shared/api/http-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/http-client")>()),
  httpClientRaw: (...args: unknown[]) => httpClientRaw(...args),
}));

vi.mock("@/shared/auth/session", () => ({
  createSession: (...args: unknown[]) => createSession(...args),
}));

const { confirmCircuitSignupAction } = await import("./confirm-circuit-signup-action");

const VALID_INPUT = { email: "joao@example.com", code: "123456" };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  httpClientRaw.mockReset();
  createSession.mockReset();
});

describe("confirmCircuitSignupAction", () => {
  describe("confirmação com sucesso", () => {
    it("deve enviar e-mail e código ao endpoint de confirmações e abrir a sessão no 201", async () => {
      httpClientRaw.mockResolvedValue(
        jsonResponse(201, {
          accessToken: "token-acesso",
          refreshToken: "token-renovacao",
          user: {
            id: "u1",
            name: "João Silva",
            email: "joao@example.com",
            role: "CIRCUIT_COORDINATOR",
            isActive: true,
            circuitId: "c1",
            congregationId: "cong1",
            mustChangePassword: false,
          },
        }),
      );

      const result = await confirmCircuitSignupAction(VALID_INPUT);

      expect(httpClientRaw).toHaveBeenCalledWith(endpoints.auth.circuitSignupConfirmations, {
        method: "POST",
        anonymous: true,
        body: { email: "joao@example.com", code: "123456" },
      });
      expect(createSession).toHaveBeenCalledWith("token-acesso", "token-renovacao", {
        id: "u1",
        name: "João Silva",
        email: "joao@example.com",
        role: "CIRCUIT_COORDINATOR",
        isActive: true,
        circuitId: "c1",
        congregationId: "cong1",
        mustChangePassword: false,
      });
      expect(result).toEqual({ status: "success" });
    });

    it("não deve chamar a API quando o código tem formato inválido", async () => {
      const result = await confirmCircuitSignupAction({ email: "joao@example.com", code: "12" });

      expect(httpClientRaw).not.toHaveBeenCalled();
      expect(createSession).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: "invalid-code",
        message: "Código inválido. Confira os 6 dígitos enviados para o seu e-mail e tente novamente.",
      });
    });
  });

  describe("estados de recusa do código", () => {
    it("deve distinguir código inválido (400)", async () => {
      httpClientRaw.mockResolvedValue(jsonResponse(400, { message: "Codigo de confirmacao invalido" }));

      const result = await confirmCircuitSignupAction(VALID_INPUT);

      expect(result).toEqual({
        status: "invalid-code",
        message: "Código inválido. Confira os 6 dígitos enviados para o seu e-mail e tente novamente.",
      });
      expect(createSession).not.toHaveBeenCalled();
    });

    it("deve distinguir código expirado ou esgotado (410) orientando a pedir um novo", async () => {
      httpClientRaw.mockResolvedValue(jsonResponse(410, { message: "Codigo de confirmacao expirado" }));

      const result = await confirmCircuitSignupAction(VALID_INPUT);

      expect(result).toEqual({
        status: "expired-code",
        message:
          'Este código expirou. Clique em "Reenviar código" para receber um novo ou revise os dados do cadastro.',
      });
      expect(createSession).not.toHaveBeenCalled();
    });

    it("deve devolver os conflitos de campo quando o 409 aponta colisão na consolidação", async () => {
      httpClientRaw.mockResolvedValue(
        jsonResponse(409, {
          message: "Este circuito ja esta em uso",
          field: "circuit.name",
        }),
      );

      const result = await confirmCircuitSignupAction(VALID_INPUT);

      expect(result).toEqual({
        status: "conflict",
        message: "Alguns dados já estão em uso. Confira os campos destacados.",
        conflicts: [{ field: "circuit.name", message: "Este circuito ja esta em uso" }],
      });
    });

    it("deve sinalizar already-confirmed quando o 409 não aponta conflito de campo", async () => {
      httpClientRaw.mockResolvedValue(jsonResponse(409, { message: "Cadastro ja confirmado" }));

      const result = await confirmCircuitSignupAction(VALID_INPUT);

      expect(result).toEqual({ status: "already-confirmed" });
    });

    it("deve orientar a aguardar quando o limite de tentativas é atingido (429)", async () => {
      httpClientRaw.mockResolvedValue(jsonResponse(429, { message: "Too Many Requests" }));

      const result = await confirmCircuitSignupAction(VALID_INPUT);

      expect(result).toEqual({
        status: "error",
        message: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
      });
    });

    it("deve devolver erro genérico em falha 5xx ou de rede", async () => {
      httpClientRaw.mockResolvedValueOnce(jsonResponse(500, { message: "Erro interno" }));
      const serverFailure = await confirmCircuitSignupAction(VALID_INPUT);
      expect(serverFailure).toEqual({
        status: "error",
        message: "Não foi possível confirmar o código agora. Verifique sua conexão e tente novamente.",
      });

      httpClientRaw.mockRejectedValueOnce(new Error("network"));
      const networkFailure = await confirmCircuitSignupAction(VALID_INPUT);
      expect(networkFailure).toEqual({
        status: "error",
        message: "Não foi possível confirmar o código agora. Verifique sua conexão e tente novamente.",
      });
    });
  });
});
