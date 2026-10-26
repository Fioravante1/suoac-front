import { beforeEach, describe, expect, it, vi } from "vitest";

import { endpoints } from "@/shared/api/http-client";

import type { SignupFormValues } from "../../model";

const httpClientRaw = vi.fn();

vi.mock("@/shared/api/http-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/http-client")>()),
  httpClientRaw: (...args: unknown[]) => httpClientRaw(...args),
}));

const { submitCircuitSignupAction } = await import("./submit-circuit-signup-action");

// ── Helpers ──────────────────────────────────────────────────────
function buildInput(overrides: Partial<SignupFormValues> = {}): SignupFormValues {
  return {
    coordinator: {
      name: "João Silva",
      email: "joao@example.com",
      phone: "(19) 99999-9999",
      password: "Senha-Segura123",
    },
    circuit: { name: "sp-17", city: "Campinas", state: "sp" },
    acceptedTerms: true,
    congregations: [
      { name: "Central", code: "sp17-central" },
      { name: "Taquaral", code: "SP17-TAQ" },
    ],
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  httpClientRaw.mockReset();
});

// ── Test Suite ───────────────────────────────────────────────────
describe("submitCircuitSignupAction", () => {
  describe("envio", () => {
    it("deve enviar o payload do contrato, anônimo, sem o aceite e com celular só em dígitos", async () => {
      httpClientRaw.mockResolvedValue(new Response(null, { status: 202 }));

      await submitCircuitSignupAction(buildInput());

      expect(httpClientRaw).toHaveBeenCalledWith(endpoints.auth.circuitSignups, {
        method: "POST",
        anonymous: true,
        body: {
          coordinator: {
            name: "João Silva",
            email: "joao@example.com",
            phone: "19999999999",
            password: "Senha-Segura123",
          },
          circuit: { name: "SP-17", city: "Campinas", state: "SP" },
          congregations: [
            { name: "Central", code: "SP17-CENTRAL" },
            { name: "Taquaral", code: "SP17-TAQ" },
          ],
        },
      });
    });

    it("deve tratar o 202 sem corpo como sucesso e devolver o e-mail", async () => {
      httpClientRaw.mockResolvedValue(new Response(null, { status: 202 }));

      const result = await submitCircuitSignupAction(buildInput());

      expect(result).toEqual({ status: "success", email: "joao@example.com" });
    });

    it("não deve tocar a API quando os dados não passam no schema", async () => {
      const result = await submitCircuitSignupAction(buildInput({ acceptedTerms: false }));

      expect(httpClientRaw).not.toHaveBeenCalled();
      expect(result).toMatchObject({ status: "error", conflicts: [] });
    });
  });

  describe("conflitos", () => {
    it("deve devolver todos os conflitos do 409 com o caminho de cada campo", async () => {
      httpClientRaw.mockResolvedValue(
        jsonResponse(409, {
          message: "Este e-mail ja esta cadastrado",
          field: "coordinator.email",
          fields: [
            { field: "coordinator.email", message: "Este e-mail ja esta cadastrado" },
            { field: "circuit.name", message: "Este circuito ja esta em uso" },
            { field: "congregations.1.code", message: "O codigo SP17-TAQ ja esta em uso por outra congregacao" },
          ],
        }),
      );

      const result = await submitCircuitSignupAction(buildInput());

      expect(result).toMatchObject({
        status: "error",
        conflicts: [
          { field: "coordinator.email", message: "Este e-mail ja esta cadastrado" },
          { field: "circuit.name", message: "Este circuito ja esta em uso" },
          { field: "congregations.1.code", message: "O codigo SP17-TAQ ja esta em uso por outra congregacao" },
        ],
      });
    });

    it("deve usar field e message quando o 409 não traz a lista", async () => {
      httpClientRaw.mockResolvedValue(
        jsonResponse(409, { message: "Este circuito ja esta em uso", field: "circuit.name" }),
      );

      const result = await submitCircuitSignupAction(buildInput());

      expect(result).toMatchObject({
        conflicts: [{ field: "circuit.name", message: "Este circuito ja esta em uso" }],
      });
    });

    it("deve apontar a linha do código repetido recusado com 422", async () => {
      httpClientRaw.mockResolvedValue(
        jsonResponse(422, {
          message: "O codigo SP17-TAQ aparece duas vezes na lista de congregacoes",
          field: "congregations.1.code",
        }),
      );

      const result = await submitCircuitSignupAction(buildInput());

      expect(result).toMatchObject({
        conflicts: [
          { field: "congregations.1.code", message: "O codigo SP17-TAQ aparece duas vezes na lista de congregacoes" },
        ],
      });
    });

    it("deve ignorar entradas malformadas da lista de conflitos", async () => {
      httpClientRaw.mockResolvedValue(
        jsonResponse(409, {
          fields: [null, { field: 1 }, { field: "circuit.name", message: "Este circuito ja esta em uso" }],
        }),
      );

      const result = await submitCircuitSignupAction(buildInput());

      expect(result).toMatchObject({
        conflicts: [{ field: "circuit.name", message: "Este circuito ja esta em uso" }],
      });
    });

    it("deve cair no erro genérico quando o 409 não aponta campo algum", async () => {
      httpClientRaw.mockResolvedValue(jsonResponse(409, { message: "Cadastro ja confirmado" }));

      const result = await submitCircuitSignupAction(buildInput());

      expect(result).toMatchObject({ status: "error", conflicts: [] });
    });
  });

  describe("falhas", () => {
    it("deve orientar a aguardar quando há tentativas demais", async () => {
      httpClientRaw.mockResolvedValue(jsonResponse(429, { message: "Too Many Requests" }));

      const result = await submitCircuitSignupAction(buildInput());

      expect(result).toEqual({
        status: "error",
        message: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
        conflicts: [],
      });
    });

    it("deve pedir para conferir os dados quando a API recusa o formato com 400", async () => {
      httpClientRaw.mockResolvedValue(jsonResponse(400, { message: ["phone invalido"] }));

      const result = await submitCircuitSignupAction(buildInput());

      expect(result).toMatchObject({ status: "error", conflicts: [] });
      expect(result.status === "error" && result.message).toMatch(/inválidos/);
    });

    it("deve devolver erro genérico em 5xx", async () => {
      httpClientRaw.mockResolvedValue(jsonResponse(500, { message: "Erro interno" }));

      const result = await submitCircuitSignupAction(buildInput());

      expect(result).toMatchObject({ status: "error", conflicts: [] });
      expect(result.status === "error" && result.message).toMatch(/Não foi possível criar o circuito/);
    });

    it("deve devolver erro genérico quando a requisição falha", async () => {
      httpClientRaw.mockRejectedValue(new Error("network"));

      const result = await submitCircuitSignupAction(buildInput());

      expect(result).toMatchObject({ status: "error", conflicts: [] });
    });
  });
});
