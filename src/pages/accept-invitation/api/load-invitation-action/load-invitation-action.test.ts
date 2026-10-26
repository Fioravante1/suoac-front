import { beforeEach, describe, expect, it, vi } from "vitest";

import { endpoints } from "@/shared/api/http-client";

const httpClientRaw = vi.fn();

vi.mock("@/shared/api/http-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/http-client")>()),
  httpClientRaw: (...args: unknown[]) => httpClientRaw(...args),
}));

const { loadInvitation } = await import("./load-invitation-action");

const TOKEN = "a".repeat(64);

const INVITATION = {
  name: "Maria Souza",
  email: "maria@example.com",
  phone: "19996543210",
  role: "CONGREGATION_COORDINATOR",
  invitedBy: "Marcos Oliveira",
  circuit: "SP-17",
  circuitCity: "Campinas",
  circuitState: "SP",
  congregation: "Jardim Paulista",
  congregationCode: "31245",
  expiresAt: "2026-10-30T12:00:00.000Z",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  httpClientRaw.mockReset();
});

describe("loadInvitation", () => {
  it("consulta o convite sem a sessão do navegador, para não escrever cookie em render", async () => {
    httpClientRaw.mockResolvedValue(jsonResponse(200, INVITATION));

    await loadInvitation(TOKEN);

    expect(httpClientRaw).toHaveBeenCalledWith(endpoints.invitations.detail(TOKEN), { anonymous: true });
  });

  it("devolve o contexto do convite pendente", async () => {
    httpClientRaw.mockResolvedValue(jsonResponse(200, INVITATION));

    await expect(loadInvitation(TOKEN)).resolves.toEqual({ status: "pending", invitation: INVITATION });
  });

  it("não chega à API com token fora do formato, que seria texto arbitrário da URL", async () => {
    const lookup = await loadInvitation("../../auth/login");

    expect(httpClientRaw).not.toHaveBeenCalled();
    expect(lookup).toEqual({ status: "rejected", rejection: { state: "not-found", details: null } });
  });

  it("não chega à API quando o link vem sem token", async () => {
    await loadInvitation("");

    expect(httpClientRaw).not.toHaveBeenCalled();
  });

  it.each([
    [404, "INVITATION_NOT_FOUND", "not-found"],
    [409, "INVITATION_USED", "used"],
    [403, "INVITATION_REVOKED", "revoked"],
  ])("distingue o status %i com código %s como %s", async (status, code, state) => {
    httpClientRaw.mockResolvedValue(jsonResponse(status, { statusCode: status, code }));

    await expect(loadInvitation(TOKEN)).resolves.toEqual({
      status: "rejected",
      rejection: { state, details: null },
    });
  });

  it("leva para a tela o contexto do convite expirado", async () => {
    const details = {
      email: "maria@example.com",
      invitedBy: "Marcos Oliveira",
      sentAt: "2026-10-14T12:00:00.000Z",
      expiresAt: "2026-10-21T12:00:00.000Z",
    };
    httpClientRaw.mockResolvedValue(jsonResponse(410, { code: "INVITATION_EXPIRED", invitation: details }));

    await expect(loadInvitation(TOKEN)).resolves.toEqual({
      status: "rejected",
      rejection: { state: "expired", details },
    });
  });

  it("não culpa o link quando a falha é do serviço", async () => {
    httpClientRaw.mockResolvedValue(jsonResponse(500, { statusCode: 500, message: "Erro interno" }));

    await expect(loadInvitation(TOKEN)).resolves.toEqual({
      status: "rejected",
      rejection: { state: "unavailable", details: null },
    });
  });

  it("trata 404 sem código como falha do serviço, não como convite inexistente", async () => {
    // Rota ausente — API sem o recurso, proxy no meio — não é veredito sobre o link.
    httpClientRaw.mockResolvedValue(new Response("Not Found", { status: 404 }));

    const lookup = await loadInvitation(TOKEN);

    expect(lookup).toEqual({ status: "rejected", rejection: { state: "unavailable", details: null } });
  });

  it("não culpa o link quando a requisição nem completa", async () => {
    httpClientRaw.mockRejectedValue(new TypeError("fetch failed"));

    const lookup = await loadInvitation(TOKEN);

    expect(lookup).toEqual({ status: "rejected", rejection: { state: "unavailable", details: null } });
  });
});
