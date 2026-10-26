import { beforeEach, describe, expect, it, vi } from "vitest";

import { endpoints } from "@/shared/api/http-client";

const httpClientRaw = vi.fn();

vi.mock("@/shared/api/http-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/http-client")>()),
  httpClientRaw: (...args: unknown[]) => httpClientRaw(...args),
}));

const { requestRenewalAction } = await import("./request-renewal-action");

const TOKEN = "a".repeat(64);
const INPUT = { token: TOKEN };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  httpClientRaw.mockReset();
  httpClientRaw.mockResolvedValue(new Response(null, { status: 204 }));
});

describe("requestRenewalAction", () => {
  it("envia o pedido sem corpo e sem a sessão do navegador", async () => {
    await requestRenewalAction(INPUT);

    expect(httpClientRaw).toHaveBeenCalledWith(endpoints.invitations.renewalRequests(TOKEN), {
      method: "POST",
      anonymous: true,
    });
  });

  it("responde pedido registrado quando o back devolve 204", async () => {
    await expect(requestRenewalAction(INPUT)).resolves.toEqual({ status: "requested" });
  });

  it.each([
    [409, "INVITATION_USED", "used"],
    [409, "INVITATION_DECLINED", "declined"],
    [403, "INVITATION_REVOKED", "revoked"],
    [404, "INVITATION_NOT_FOUND", "not-found"],
    [409, "INVITATION_EMAIL_ALREADY_REGISTERED", "email-registered"],
  ])("distingue pelo código, não pelo status: %i %s vira %s", async (status, code, state) => {
    httpClientRaw.mockResolvedValue(jsonResponse(status, { statusCode: status, code }));

    await expect(requestRenewalAction(INPUT)).resolves.toEqual({
      status: "rejected",
      rejection: { state, details: null },
    });
  });

  it("manda recarregar quando o convite ainda é válido, sem trocar o aviso", async () => {
    httpClientRaw.mockResolvedValue(jsonResponse(409, { statusCode: 409, code: "INVITATION_NOT_EXPIRED" }));

    await expect(requestRenewalAction(INPUT)).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("Recarregue a página"),
    });
  });

  it("orienta a esperar quando o limite de tentativas é atingido", async () => {
    httpClientRaw.mockResolvedValue(jsonResponse(429, {}));

    await expect(requestRenewalAction(INPUT)).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("Muitas tentativas"),
    });
  });

  it.each([[500], [502], [404], [400]])("trata %i sem código como falha do serviço", async (status) => {
    httpClientRaw.mockResolvedValue(new Response("falha", { status }));

    await expect(requestRenewalAction(INPUT)).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("Não foi possível enviar o pedido agora"),
    });
  });

  it("trata a rede caída como falha recuperável", async () => {
    httpClientRaw.mockRejectedValue(new Error("fetch failed"));

    await expect(requestRenewalAction(INPUT)).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("Não foi possível enviar o pedido agora"),
    });
  });
});
