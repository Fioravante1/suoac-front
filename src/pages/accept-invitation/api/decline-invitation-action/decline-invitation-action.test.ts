import { beforeEach, describe, expect, it, vi } from "vitest";

import { endpoints } from "@/shared/api/http-client";

const httpClientRaw = vi.fn();

vi.mock("@/shared/api/http-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/http-client")>()),
  httpClientRaw: (...args: unknown[]) => httpClientRaw(...args),
}));

const { declineInvitationAction } = await import("./decline-invitation-action");

const TOKEN = "a".repeat(64);
const INPUT = { token: TOKEN, reason: "RECEIVED_BY_MISTAKE" } as const;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  httpClientRaw.mockReset();
  httpClientRaw.mockResolvedValue(new Response(null, { status: 204 }));
});

describe("declineInvitationAction", () => {
  it("envia só o motivo, sem a sessão do navegador", async () => {
    await declineInvitationAction(INPUT);

    expect(httpClientRaw).toHaveBeenCalledWith(endpoints.invitations.declines(TOKEN), {
      method: "POST",
      anonymous: true,
      body: { reason: "RECEIVED_BY_MISTAKE" },
    });
  });

  it("responde recusado quando o back devolve 204", async () => {
    await expect(declineInvitationAction(INPUT)).resolves.toEqual({ status: "declined" });
  });

  it.each([
    [409, "INVITATION_USED", "used"],
    [409, "INVITATION_DECLINED", "declined"],
    [403, "INVITATION_REVOKED", "revoked"],
    [404, "INVITATION_NOT_FOUND", "not-found"],
  ])("distingue pelo código, não pelo status: %i %s vira %s", async (status, code, state) => {
    httpClientRaw.mockResolvedValue(jsonResponse(status, { statusCode: status, code }));

    await expect(declineInvitationAction(INPUT)).resolves.toEqual({
      status: "rejected",
      rejection: { state, details: null },
    });
  });

  it("leva o contexto do convite que expirou", async () => {
    const details = {
      email: "maria@example.com",
      invitedBy: "Marcos Oliveira",
      sentAt: "2026-10-14T12:00:00.000Z",
      expiresAt: "2026-10-21T12:00:00.000Z",
    };
    httpClientRaw.mockResolvedValue(jsonResponse(410, { code: "INVITATION_EXPIRED", invitation: details }));

    await expect(declineInvitationAction(INPUT)).resolves.toEqual({
      status: "rejected",
      rejection: { state: "expired", details },
    });
  });

  it("não envia nada quando o motivo não é um dos três", async () => {
    const result = await declineInvitationAction({ token: TOKEN, reason: "OUTRO" as never });

    expect(result).toEqual({ status: "error", message: expect.stringContaining("Escolha um dos motivos") });
    expect(httpClientRaw).not.toHaveBeenCalled();
  });

  it("não aceita como motivo o nome de uma propriedade herdada", async () => {
    await declineInvitationAction({ token: TOKEN, reason: "toString" as never });

    expect(httpClientRaw).not.toHaveBeenCalled();
  });

  it("orienta a esperar quando o limite de tentativas é atingido", async () => {
    httpClientRaw.mockResolvedValue(jsonResponse(429, {}));

    await expect(declineInvitationAction(INPUT)).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("Muitas tentativas"),
    });
  });

  it("trata 400 sem código como motivo inválido, não como veredito sobre o link", async () => {
    httpClientRaw.mockResolvedValue(jsonResponse(400, { statusCode: 400, message: ["reason inválido"] }));

    await expect(declineInvitationAction(INPUT)).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("Escolha um dos motivos"),
    });
  });

  it.each([[500], [502], [404]])("trata %i sem código como falha do serviço", async (status) => {
    httpClientRaw.mockResolvedValue(new Response("falha", { status }));

    await expect(declineInvitationAction(INPUT)).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("Não foi possível recusar o convite agora"),
    });
  });

  it("trata a rede caída como falha recuperável", async () => {
    httpClientRaw.mockRejectedValue(new Error("fetch failed"));

    await expect(declineInvitationAction(INPUT)).resolves.toEqual({
      status: "error",
      message: expect.stringContaining("Não foi possível recusar o convite agora"),
    });
  });
});
