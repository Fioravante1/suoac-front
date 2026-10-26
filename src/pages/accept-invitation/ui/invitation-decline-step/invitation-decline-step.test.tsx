import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeclineInvitationResult } from "../../api";

const declineInvitationAction = vi.fn<(input: unknown) => Promise<DeclineInvitationResult>>();

vi.mock("../../api", () => ({
  declineInvitationAction: (input: unknown) => declineInvitationAction(input),
}));

const { InvitationDeclineStep } = await import("./invitation-decline-step");

const TOKEN = "a".repeat(64);

function renderStep() {
  const handlers = { onBack: vi.fn(), onDeclined: vi.fn(), onRejected: vi.fn() };

  render(
    <InvitationDeclineStep token={TOKEN} invitedBy="Marcos Oliveira" congregation="Jardim Paulista" {...handlers} />,
  );

  return handlers;
}

function chooseAndConfirm(reason = "Recebi por engano") {
  fireEvent.click(screen.getByRole("radio", { name: reason }));
  fireEvent.click(screen.getByRole("button", { name: "Recusar" }));
}

beforeEach(() => {
  declineInvitationAction.mockReset();
  declineInvitationAction.mockResolvedValue({ status: "declined" });
});

describe("InvitationDeclineStep", () => {
  it("pergunta se a pessoa quer recusar e diz o que acontece com a vaga", () => {
    renderStep();

    expect(screen.getByRole("heading", { name: "Recusar convite?" })).toBeInTheDocument();
    expect(screen.getByText(/Marcos Oliveira poderá convidar outra pessoa para a Jardim Paulista/)).toBeInTheDocument();
  });

  it("oferece os três motivos do desenho como opções de um grupo", () => {
    renderStep();

    expect(screen.getByRole("group", { name: "Motivo da recusa" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Não sou a pessoa indicada" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Não posso assumir este privilégio agora" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Recebi por engano" })).toBeInTheDocument();
  });

  it("só habilita Recusar depois de escolher um motivo", () => {
    renderStep();
    expect(screen.getByRole("button", { name: "Recusar" })).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: "Recebi por engano" }));

    expect(screen.getByRole("button", { name: "Recusar" })).toBeEnabled();
  });

  it("volta para a tela anterior", () => {
    const { onBack } = renderStep();

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["Não sou a pessoa indicada", "NOT_THE_PERSON"],
    ["Não posso assumir este privilégio agora", "CANNOT_ASSUME_NOW"],
    ["Recebi por engano", "RECEIVED_BY_MISTAKE"],
  ])("envia o motivo %s como %s", async (label, reason) => {
    renderStep();

    chooseAndConfirm(label);

    await waitFor(() => expect(declineInvitationAction).toHaveBeenCalledWith({ token: TOKEN, reason }));
  });

  it("avisa quem monta a página quando a recusa é gravada", async () => {
    const { onDeclined, onRejected } = renderStep();

    chooseAndConfirm();

    await waitFor(() => expect(onDeclined).toHaveBeenCalledTimes(1));
    expect(onRejected).not.toHaveBeenCalled();
  });

  it("trava a tela enquanto a recusa é enviada, para não enviar duas vezes", async () => {
    let finish: (result: DeclineInvitationResult) => void = () => undefined;
    declineInvitationAction.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderStep();

    chooseAndConfirm();

    expect(await screen.findByRole("button", { name: /Recusando/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeDisabled();
    finish({ status: "declined" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Recusar" })).toBeEnabled());
  });

  it("entrega o aviso quando o convite mudou de estado antes da recusa", async () => {
    const rejection = { state: "revoked", details: null } as const;
    declineInvitationAction.mockResolvedValue({ status: "rejected", rejection });
    const { onRejected, onDeclined } = renderStep();

    chooseAndConfirm();

    await waitFor(() => expect(onRejected).toHaveBeenCalledWith(rejection));
    expect(onDeclined).not.toHaveBeenCalled();
  });

  it("mantém a tela e o motivo escolhido quando o serviço falha, para tentar de novo", async () => {
    declineInvitationAction.mockResolvedValue({ status: "error", message: "Aguarde um pouco e tente de novo." });
    const { onDeclined } = renderStep();

    chooseAndConfirm("Não sou a pessoa indicada");

    expect(await screen.findByRole("alert")).toHaveTextContent("Aguarde um pouco e tente de novo.");
    expect(screen.getByRole("radio", { name: "Não sou a pessoa indicada" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Recusar" })).toBeEnabled();
    expect(onDeclined).not.toHaveBeenCalled();
  });

  it("mostra uma mensagem quando a action nem chega a responder", async () => {
    declineInvitationAction.mockRejectedValue(new Error("Failed to fetch"));
    renderStep();

    chooseAndConfirm();

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível recusar o convite agora");
    expect(screen.getByRole("button", { name: "Recusar" })).toBeEnabled();
  });

  it("não mostra erro antes de confirmar", () => {
    renderStep();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
