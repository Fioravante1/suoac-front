import { beforeEach, describe, expect, it, vi } from "vitest";

import { endpoints } from "@/shared/api/http-client";

import type { InvitationLookup } from "../../model";

const httpClientRaw = vi.fn();
const createSession = vi.fn();
const loadInvitation = vi.fn<(token: string) => Promise<InvitationLookup>>();
const saveWelcomeSummary = vi.fn();
const redirect = vi.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));

vi.mock("@/shared/api/http-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/http-client")>()),
  httpClientRaw: (...args: unknown[]) => httpClientRaw(...args),
}));

vi.mock("@/shared/auth/session", () => ({
  createSession: (...args: unknown[]) => createSession(...args),
}));

vi.mock("../load-invitation-action", () => ({ loadInvitation: (token: string) => loadInvitation(token) }));
vi.mock("../welcome-cookie", () => ({ saveWelcomeSummary: (...args: unknown[]) => saveWelcomeSummary(...args) }));

const { acceptInvitationAction } = await import("./accept-invitation-action");

const TOKEN = "a".repeat(64);

const INPUT = { token: TOKEN, name: "Maria Souza", phone: "(19) 99654-3210", password: "Senha@123" };

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

const USER = {
  id: "u1",
  name: "Maria Souza",
  email: "maria@example.com",
  role: "CONGREGATION_COORDINATOR",
  isActive: true,
  circuitId: "c1",
  congregationId: "cong1",
  mustChangePassword: false,
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  httpClientRaw.mockReset();
  createSession.mockReset();
  loadInvitation.mockReset();
  saveWelcomeSummary.mockReset();
  redirect.mockClear();
  loadInvitation.mockResolvedValue({ status: "pending", invitation: INVITATION });
});

describe("acceptInvitationAction", () => {
  describe("aceite com sucesso", () => {
    beforeEach(() => {
      httpClientRaw.mockResolvedValue(
        jsonResponse(201, { accessToken: "acesso", refreshToken: "renovacao", user: USER }),
      );
    });

    it("envia nome, celular só com dígitos e senha, sem a sessão do navegador", async () => {
      await expect(acceptInvitationAction(INPUT)).rejects.toThrow("NEXT_REDIRECT");

      expect(httpClientRaw).toHaveBeenCalledWith(endpoints.invitations.acceptances(TOKEN), {
        method: "POST",
        anonymous: true,
        body: { name: "Maria Souza", phone: "19996543210", password: "Senha@123" },
      });
    });

    it("abre a sessão com o usuário devolvido", async () => {
      await expect(acceptInvitationAction(INPUT)).rejects.toThrow("NEXT_REDIRECT");

      expect(createSession).toHaveBeenCalledWith("acesso", "renovacao", USER);
    });

    it("guarda o cartão do convite para a tela de boas-vindas, com o nome confirmado", async () => {
      httpClientRaw.mockResolvedValue(
        jsonResponse(201, { accessToken: "a", refreshToken: "r", user: { ...USER, name: "Maria de Souza Lima" } }),
      );

      await expect(acceptInvitationAction(INPUT)).rejects.toThrow("NEXT_REDIRECT");

      expect(saveWelcomeSummary).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Maria de Souza Lima",
          email: "maria@example.com",
          invitedBy: "Marcos Oliveira",
          congregation: "Jardim Paulista",
        }),
      );
    });

    it("termina em redirect para a tela de boas-vindas, sem o token na URL", async () => {
      await expect(acceptInvitationAction(INPUT)).rejects.toThrow("NEXT_REDIRECT:/accept-invitation?status=bem-vindo");
    });

    it("segue para as boas-vindas mesmo se o resumo não for guardado, porque a sessão já está aberta", async () => {
      saveWelcomeSummary.mockRejectedValue(new Error("cookie"));

      await expect(acceptInvitationAction(INPUT)).rejects.toThrow("NEXT_REDIRECT");
    });

    it("não perde o cadastro quando a sessão não abre: orienta a entrar pela tela de entrada", async () => {
      createSession.mockRejectedValue(new Error("cookie"));

      const result = await acceptInvitationAction(INPUT);

      expect(result).toEqual({ status: "error", message: expect.stringContaining("Entre pela tela de entrada") });
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("resposta de sucesso que não dá para usar", () => {
    it.each([
      ["corpo vazio", new Response(null, { status: 201 })],
      ["corpo que não é JSON", new Response("<html>", { status: 201 })],
      ["corpo sem o usuário", jsonResponse(201, { accessToken: "a", refreshToken: "r" })],
    ])("orienta a entrar pela tela de entrada, porque a conta já existe: %s", async (_case, response) => {
      httpClientRaw.mockResolvedValue(response);

      const result = await acceptInvitationAction(INPUT);

      expect(result).toEqual({ status: "error", message: expect.stringContaining("Entre pela tela de entrada") });
      expect(createSession).not.toHaveBeenCalled();
    });
  });

  describe("convite que deixou de servir", () => {
    it("não envia nada quando a releitura mostra o convite expirado", async () => {
      const rejection = { state: "expired", details: null } as const;
      loadInvitation.mockResolvedValue({ status: "rejected", rejection });

      const result = await acceptInvitationAction(INPUT);

      expect(result).toEqual({ status: "rejected", rejection });
      expect(httpClientRaw).not.toHaveBeenCalled();
    });

    it("mantém o formulário quando a releitura falha por oscilação do serviço, sem trocar a tela", async () => {
      loadInvitation.mockResolvedValue({
        status: "rejected",
        rejection: { state: "unavailable", details: null },
      });

      const result = await acceptInvitationAction(INPUT);

      expect(result).toEqual({ status: "error", message: expect.stringContaining("Não foi possível concluir") });
      expect(httpClientRaw).not.toHaveBeenCalled();
    });

    it.each([
      [409, "INVITATION_USED", "used"],
      [403, "INVITATION_REVOKED", "revoked"],
      [409, "INVITATION_EMAIL_ALREADY_REGISTERED", "email-registered"],
    ])("distingue pelo código, não pelo status: %i %s vira %s", async (status, code, state) => {
      httpClientRaw.mockResolvedValue(jsonResponse(status, { statusCode: status, code }));

      const result = await acceptInvitationAction(INPUT);

      expect(result).toEqual({ status: "rejected", rejection: { state, details: null } });
      expect(createSession).not.toHaveBeenCalled();
    });

    it("leva o contexto do convite que expirou entre a releitura e o envio", async () => {
      const details = {
        email: "maria@example.com",
        invitedBy: "Marcos Oliveira",
        sentAt: "2026-10-14T12:00:00.000Z",
        expiresAt: "2026-10-21T12:00:00.000Z",
      };
      httpClientRaw.mockResolvedValue(jsonResponse(410, { code: "INVITATION_EXPIRED", invitation: details }));

      const result = await acceptInvitationAction(INPUT);

      expect(result).toEqual({ status: "rejected", rejection: { state: "expired", details } });
    });
  });

  describe("falhas que o formulário resolve", () => {
    it("não chama a API com dados que o schema recusa", async () => {
      const result = await acceptInvitationAction({ ...INPUT, name: "Maria" });

      expect(result.status).toBe("error");
      expect(loadInvitation).not.toHaveBeenCalled();
      expect(httpClientRaw).not.toHaveBeenCalled();
    });

    it("pede para aguardar quando o limite de tentativas estoura", async () => {
      httpClientRaw.mockResolvedValue(jsonResponse(429, { statusCode: 429 }));

      const result = await acceptInvitationAction(INPUT);

      expect(result).toEqual({ status: "error", message: expect.stringContaining("Muitas tentativas") });
    });

    it("não culpa o convite quando a falha é do serviço", async () => {
      httpClientRaw.mockResolvedValue(jsonResponse(500, { statusCode: 500 }));

      const result = await acceptInvitationAction(INPUT);

      expect(result).toEqual({ status: "error", message: expect.stringContaining("Não foi possível concluir") });
    });

    it("não culpa o convite quando a requisição nem completa", async () => {
      httpClientRaw.mockRejectedValue(new TypeError("fetch failed"));

      const result = await acceptInvitationAction(INPUT);

      expect(result.status).toBe("error");
    });
  });
});
