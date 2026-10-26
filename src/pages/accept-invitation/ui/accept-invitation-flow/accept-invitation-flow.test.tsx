import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Invitation } from "@/entities/invitation";

import type { AcceptInvitationResult, DeclineInvitationResult } from "../../api";

const acceptInvitationAction = vi.fn<(input: unknown) => Promise<AcceptInvitationResult>>();

const declineInvitationAction = vi.fn<(input: unknown) => Promise<DeclineInvitationResult>>();

vi.mock("../../api", () => ({
  acceptInvitationAction: (input: unknown) => acceptInvitationAction(input),
  declineInvitationAction: (input: unknown) => declineInvitationAction(input),
  requestRenewalAction: vi.fn(),
}));

const { AcceptInvitationFlow } = await import("./accept-invitation-flow");

const TOKEN = "a".repeat(64);
const SENHA = "Senha@Segura123";

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

/**
 * `redirect` na action chega ao cliente como rejeicao, depois de o roteador ja
 * ter aplicado a navegacao. E assim que o sucesso se manifesta aqui.
 */
function redirectRejection() {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/accept-invitation?status=bem-vindo;303;",
  });
}

function renderFlow(invitation: Invitation = INVITATION, onDeclined = vi.fn()) {
  render(<AcceptInvitationFlow token={TOKEN} invitation={invitation} onDeclined={onDeclined} />);

  return onDeclined;
}

function advance() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

async function goToPasswordStep() {
  advance();
  await screen.findByRole("heading", { name: "Crie sua senha" });
}

function fillPassword(password = SENHA, confirmation = password) {
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirme a senha"), { target: { value: confirmation } });
}

function acceptTerms() {
  fireEvent.click(screen.getByRole("checkbox"));
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Aceitar convite e entrar" }));
}

beforeEach(() => {
  declineInvitationAction.mockReset();
  acceptInvitationAction.mockReset();
});

describe("AcceptInvitationFlow — etapa de dados", () => {
  it("cumprimenta o convidado pelo primeiro nome", () => {
    renderFlow();

    expect(screen.getByRole("heading", { name: "Olá, Ana!" })).toBeInTheDocument();
  });

  it("não abre em 'Olá, !' quando o convite não traz um nome utilizável", () => {
    renderFlow({ ...INVITATION, name: "   " });

    expect(screen.getByRole("heading", { name: "Olá!" })).toBeInTheDocument();
  });

  it("abre com nome e celular do convite, o celular já com máscara", () => {
    renderFlow();

    expect(screen.getByLabelText("Nome completo")).toHaveValue("Ana Beatriz Souza");
    expect(screen.getByLabelText("Celular (WhatsApp)")).toHaveValue("(19) 99654-3210");
  });

  it("abre com celular vazio quando o convite não trouxe um", () => {
    renderFlow({ ...INVITATION, phone: null });

    expect(screen.getByLabelText("Celular (WhatsApp)")).toHaveValue("");
  });

  it("mostra o e-mail do convite travado, como o login que ele será", () => {
    renderFlow();

    expect(screen.getByLabelText("E-mail")).toHaveValue("ana.souza@email.com");
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("readonly");
    expect(screen.getByText("Verificado pelo convite")).toBeInTheDocument();
  });

  it("começa na etapa 1 de 2", () => {
    renderFlow();

    expect(screen.getByText("Etapa 1 de 2")).toBeInTheDocument();
  });

  it("avança para a senha quando nome e celular estão válidos", async () => {
    renderFlow();

    await goToPasswordStep();

    expect(screen.getByText("Etapa 2 de 2")).toBeInTheDocument();
  });

  it("não avança com nome sem sobrenome e diz o que corrigir", async () => {
    renderFlow();
    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Ana" } });

    advance();

    expect(await screen.findByText("Informe nome e sobrenome.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Crie sua senha" })).not.toBeInTheDocument();
  });

  it("não avança com celular incompleto", async () => {
    renderFlow();
    fireEvent.change(screen.getByLabelText("Celular (WhatsApp)"), { target: { value: "199965" } });

    advance();

    expect(await screen.findByText("Informe o DDD e o número completo.")).toBeInTheDocument();
  });

  it('diz quem preencheu os dados com o nome completo do privilégio, nunca "coordenador" sozinho', () => {
    renderFlow();

    expect(
      screen.getByText(/Confira os dados que o coordenador do arranjo de ônibus no circuito preencheu/),
    ).toBeInTheDocument();
  });

  it("avança com Enter, em vez de enviar o formulário incompleto", async () => {
    renderFlow();

    fireEvent.submit(screen.getByLabelText("Nome completo").closest("form") as HTMLFormElement);

    expect(await screen.findByRole("heading", { name: "Crie sua senha" })).toBeInTheDocument();
    expect(acceptInvitationAction).not.toHaveBeenCalled();
  });

  it("oferece a recusa do convite para quem não é a pessoa convidada", () => {
    renderFlow();

    expect(screen.getByText("Não é você?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recusar convite" })).toBeInTheDocument();
  });

  it("leva à tela de recusa e volta sem perder o que foi digitado", () => {
    renderFlow();
    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Ana B. Souza" } });

    fireEvent.click(screen.getByRole("button", { name: "Recusar convite" }));
    expect(screen.getByRole("heading", { name: "Recusar convite?" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(screen.getByLabelText("Nome completo")).toHaveValue("Ana B. Souza");
  });

  it("recusa o convite com o motivo escolhido e avisa quem montou a página", async () => {
    declineInvitationAction.mockResolvedValue({ status: "declined" });
    const onDeclined = renderFlow();
    fireEvent.click(screen.getByRole("button", { name: "Recusar convite" }));
    fireEvent.click(screen.getByRole("radio", { name: "Recebi por engano" }));

    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));

    await waitFor(() => expect(onDeclined).toHaveBeenCalledTimes(1));
    expect(declineInvitationAction).toHaveBeenCalledWith({ token: TOKEN, reason: "RECEIVED_BY_MISTAKE" });
  });

  it("troca a tela pelo aviso quando o convite mudou de estado antes da recusa", async () => {
    declineInvitationAction.mockResolvedValue({ status: "rejected", rejection: { state: "used", details: null } });
    const onDeclined = renderFlow();
    fireEvent.click(screen.getByRole("button", { name: "Recusar convite" }));
    fireEvent.click(screen.getByRole("radio", { name: "Recebi por engano" }));

    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));

    expect(await screen.findByRole("heading", { name: "Este convite já foi usado" })).toBeInTheDocument();
    expect(onDeclined).not.toHaveBeenCalled();
  });
});

describe("AcceptInvitationFlow — etapa de senha", () => {
  it("diz que o e-mail do convite e a senha serão o login", async () => {
    renderFlow();

    await goToPasswordStep();

    expect(screen.getByText(/ana\.souza@email\.com e esta senha/)).toBeInTheDocument();
  });

  it("volta para os dados sem perder o que foi digitado", async () => {
    renderFlow();
    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Ana B. Souza" } });
    await goToPasswordStep();

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(screen.getByLabelText("Nome completo")).toHaveValue("Ana B. Souza");
  });

  it("avisa enquanto se digita se as senhas coincidem ou não", async () => {
    renderFlow();
    await goToPasswordStep();

    fillPassword(SENHA, "Outra@1234");
    expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();

    fillPassword(SENHA, SENHA);
    expect(screen.getByText("As senhas coincidem")).toBeInTheDocument();
  });

  it("exige o aceite dos termos e não chama a action sem ele", async () => {
    renderFlow();
    await goToPasswordStep();
    fillPassword();

    submit();

    expect(await screen.findByText("Aceite os termos para continuar.")).toBeInTheDocument();
    expect(acceptInvitationAction).not.toHaveBeenCalled();
  });

  it("leva os termos e a privacidade em nova aba, para não perder o formulário", async () => {
    renderFlow();
    await goToPasswordStep();

    expect(screen.getByRole("link", { name: "termos de uso" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "política de privacidade" })).toHaveAttribute("href", "/privacidade");
  });
});

describe("AcceptInvitationFlow — envio", () => {
  async function fillAndSubmit() {
    await goToPasswordStep();
    fillPassword();
    acceptTerms();
    submit();
  }

  it("envia token, nome, celular e senha, sempre, mesmo sem nenhuma alteração", async () => {
    acceptInvitationAction.mockImplementation(() => new Promise<AcceptInvitationResult>(() => {}));
    renderFlow();

    await fillAndSubmit();

    await waitFor(() =>
      expect(acceptInvitationAction).toHaveBeenCalledWith({
        token: TOKEN,
        name: "Ana Beatriz Souza",
        phone: "(19) 99654-3210",
        password: SENHA,
        acceptedTerms: true,
      }),
    );
  });

  it("envia o nome e o celular corrigidos pelo convidado", async () => {
    acceptInvitationAction.mockImplementation(() => new Promise<AcceptInvitationResult>(() => {}));
    renderFlow();
    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Ana B. Souza" } });
    fireEvent.change(screen.getByLabelText("Celular (WhatsApp)"), { target: { value: "19911112222" } });

    await fillAndSubmit();

    await waitFor(() =>
      expect(acceptInvitationAction).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Ana B. Souza", phone: "(19) 91111-2222" }),
      ),
    );
  });

  it("fecha o formulário enquanto a navegação para as boas-vindas acontece", async () => {
    // O sucesso termina em `redirect`; reabrir o botao reenviaria um convite ja consumido.
    acceptInvitationAction.mockRejectedValue(redirectRejection());
    renderFlow();

    await fillAndSubmit();

    await waitFor(() => expect(screen.getByRole("button", { name: /Ativando acesso/ })).toBeDisabled());
  });

  it("troca o formulário pelo aviso quando o convite deixou de servir", async () => {
    acceptInvitationAction.mockResolvedValue({
      status: "rejected",
      rejection: { state: "used", details: null },
    });
    renderFlow();

    await fillAndSubmit();

    expect(await screen.findByRole("heading", { name: "Este convite já foi usado" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
  });

  it("orienta o login quando o e-mail do convite já tem conta", async () => {
    acceptInvitationAction.mockResolvedValue({
      status: "rejected",
      rejection: { state: "email-registered", details: null },
    });
    renderFlow();

    await fillAndSubmit();

    expect(await screen.findByRole("heading", { name: "Este e-mail já tem uma conta" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para a entrada" })).toHaveAttribute("href", "/login");
  });

  it("mantém o formulário e mostra o erro quando a falha é recuperável", async () => {
    acceptInvitationAction.mockResolvedValue({ status: "error", message: "Muitas tentativas em pouco tempo." });
    renderFlow();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Muitas tentativas em pouco tempo.");
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
  });

  it("não deixa a tela muda quando a action falha antes de responder", async () => {
    acceptInvitationAction.mockRejectedValue(new TypeError("Failed to fetch"));
    renderFlow();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível concluir o cadastro agora.");
  });
});
