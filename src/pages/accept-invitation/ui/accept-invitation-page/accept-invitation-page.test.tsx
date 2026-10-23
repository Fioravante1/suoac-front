import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Invitation } from "@/entities/invitation";

import type { InvitationLookup, WelcomeSummary } from "../../model";

const loadInvitation = vi.fn<(token: string) => Promise<InvitationLookup>>();
const readWelcomeSummary = vi.fn<() => Promise<WelcomeSummary | null>>();
const getSession = vi.fn();
const redirect = vi.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("@/shared/auth/session", () => ({ getSession: () => getSession() }));

vi.mock("../../api/load-invitation-action", () => ({
  loadInvitation: (token: string) => loadInvitation(token),
}));

vi.mock("../../api/welcome-cookie", () => ({
  readWelcomeSummary: () => readWelcomeSummary(),
}));

vi.mock("@/widgets/auth-shell", () => ({
  AuthShell: ({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) => (
    <div data-testid="auth-shell">
      <div data-testid="aside">{aside}</div>
      {children}
    </div>
  ),
  BrandPanelFrame: ({ children }: { children: React.ReactNode }) => <aside>{children}</aside>,
}));

vi.mock("../accept-invitation-flow", () => ({
  AcceptInvitationFlow: ({ token }: { token: string }) => <form data-testid="flow">{token}</form>,
}));

const { AcceptInvitationPage } = await import("./accept-invitation-page");

const TOKEN = "a".repeat(64);

const INVITATION: Invitation = {
  name: "Ana Beatriz Souza",
  email: "ana.souza@email.com",
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

const SUMMARY: WelcomeSummary = {
  name: "Ana Beatriz Souza",
  email: "ana.souza@email.com",
  role: "CONGREGATION_COORDINATOR",
  invitedBy: "Marcos Oliveira",
  circuit: "SP-17",
  circuitCity: "Campinas",
  circuitState: "SP",
  congregation: "Jardim Paulista",
  congregationCode: "31245",
};

beforeEach(() => {
  loadInvitation.mockReset();
  readWelcomeSummary.mockReset();
  getSession.mockReset();
  redirect.mockClear();
});

describe("AcceptInvitationPage", () => {
  it("consulta o convite no servidor antes de mostrar qualquer campo", async () => {
    loadInvitation.mockResolvedValue({ status: "pending", invitation: INVITATION });

    render(await AcceptInvitationPage({ token: TOKEN }));

    expect(loadInvitation).toHaveBeenCalledWith(TOKEN);
    expect(screen.getByTestId("flow")).toHaveTextContent(TOKEN);
  });

  it("mostra o cartão do convite à esquerda, aguardando o convidado, com a validade", async () => {
    loadInvitation.mockResolvedValue({ status: "pending", invitation: INVITATION });

    render(await AcceptInvitationPage({ token: TOKEN }));

    expect(screen.getByText("Aguardando você")).toBeInTheDocument();
    expect(screen.getByText("Convite válido até 30/10/2026")).toBeInTheDocument();
  });

  it("mostra o aviso do estado em vez do formulário quando o convite não serve", async () => {
    loadInvitation.mockResolvedValue({
      status: "rejected",
      rejection: { state: "revoked", details: null },
    });

    render(await AcceptInvitationPage({ token: TOKEN }));

    expect(screen.getByRole("heading", { name: "Este convite foi cancelado" })).toBeInTheDocument();
    expect(screen.queryByTestId("flow")).not.toBeInTheDocument();
  });

  it("fica com o painel padrão da marca quando não há cartão para mostrar", async () => {
    loadInvitation.mockResolvedValue({
      status: "rejected",
      rejection: { state: "used", details: null },
    });

    render(await AcceptInvitationPage({ token: TOKEN }));

    expect(screen.getByTestId("aside")).toBeEmptyDOMElement();
  });

  it("consulta o token em minúsculas, que é como o back o gera", async () => {
    loadInvitation.mockResolvedValue({ status: "pending", invitation: INVITATION });

    render(await AcceptInvitationPage({ token: TOKEN.toUpperCase() }));

    expect(loadInvitation).toHaveBeenCalledWith(TOKEN);
  });

  it("trata query string repetida como link sem token", async () => {
    loadInvitation.mockResolvedValue({
      status: "rejected",
      rejection: { state: "not-found", details: null },
    });

    render(await AcceptInvitationPage({ token: ["a", "b"] }));

    expect(loadInvitation).toHaveBeenCalledWith("");
  });

  it("trata link sem token como convite inválido", async () => {
    loadInvitation.mockResolvedValue({
      status: "rejected",
      rejection: { state: "not-found", details: null },
    });

    render(await AcceptInvitationPage({}));

    expect(loadInvitation).toHaveBeenCalledWith("");
    expect(screen.getByRole("heading", { name: "Este convite não é válido" })).toBeInTheDocument();
  });

  describe("depois do aceite", () => {
    const OWN_SESSION = { id: "u1", email: "ana.souza@email.com" };

    it("dá as boas-vindas com o cartão carimbado, sem consultar o convite já consumido", async () => {
      readWelcomeSummary.mockResolvedValue(SUMMARY);
      getSession.mockResolvedValue(OWN_SESSION);

      render(await AcceptInvitationPage({ status: "bem-vindo" }));

      expect(screen.getByRole("heading", { name: "Bem-vindo, Ana!" })).toBeInTheDocument();
      expect(screen.getByText("Aceito")).toBeInTheDocument();
      expect(screen.getByText("Convite aceito hoje")).toBeInTheDocument();
      expect(loadInvitation).not.toHaveBeenCalled();
    });

    it("compara o e-mail da sessão com o do resumo sem diferenciar maiúsculas", async () => {
      readWelcomeSummary.mockResolvedValue(SUMMARY);
      getSession.mockResolvedValue({ id: "u1", email: "Ana.Souza@Email.com" });

      render(await AcceptInvitationPage({ status: "bem-vindo" }));

      expect(screen.getByRole("heading", { name: "Bem-vindo, Ana!" })).toBeInTheDocument();
    });

    it("não mostra o resumo de outra pessoa a quem abre a URL num computador compartilhado", async () => {
      readWelcomeSummary.mockResolvedValue(SUMMARY);
      getSession.mockResolvedValue({ id: "u2", email: "outra.pessoa@email.com" });

      await expect(AcceptInvitationPage({ status: "bem-vindo" })).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    });

    it("não mostra o resumo a quem não tem sessão: manda para a entrada", async () => {
      readWelcomeSummary.mockResolvedValue(SUMMARY);
      getSession.mockResolvedValue(null);

      await expect(AcceptInvitationPage({ status: "bem-vindo" })).rejects.toThrow("NEXT_REDIRECT:/login");
    });

    it("manda ao painel quem abre as boas-vindas sem resumo mas com sessão", async () => {
      readWelcomeSummary.mockResolvedValue(null);
      getSession.mockResolvedValue({ id: "u1", email: "ana.souza@email.com" });

      await expect(AcceptInvitationPage({ status: "bem-vindo" })).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    });

    it("manda para a entrada, e não para um aviso de convite inválido, quem acabou de criar a conta e perdeu o resumo", async () => {
      readWelcomeSummary.mockResolvedValue(null);
      getSession.mockResolvedValue(null);

      await expect(AcceptInvitationPage({ status: "bem-vindo" })).rejects.toThrow("NEXT_REDIRECT:/login");
      expect(loadInvitation).not.toHaveBeenCalled();
    });
  });
});
