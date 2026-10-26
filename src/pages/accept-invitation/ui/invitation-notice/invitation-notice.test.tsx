import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RequestRenewalResult } from "../../api";
import type { InvitationNoticeState } from "../../model";

const requestRenewalAction = vi.fn<(input: unknown) => Promise<RequestRenewalResult>>();

vi.mock("../../api", () => ({
  requestRenewalAction: (input: unknown) => requestRenewalAction(input),
}));

const { InvitationNotice } = await import("./invitation-notice");

const TOKEN = "a".repeat(64);

const DETAILS = {
  email: "maria@example.com",
  invitedBy: "Marcos Oliveira",
  sentAt: "2026-10-14T12:00:00.000Z",
  expiresAt: "2026-10-21T12:00:00.000Z",
};

function renderNotice(state: InvitationNoticeState, details = null as typeof DETAILS | null) {
  return render(<InvitationNotice rejection={{ state, details }} token={TOKEN} />);
}

beforeEach(() => {
  requestRenewalAction.mockReset();
  requestRenewalAction.mockResolvedValue({ status: "requested" });
});

describe("InvitationNotice", () => {
  it.each([
    ["expired", "Este convite expirou"],
    ["used", "Este convite já foi usado"],
    ["revoked", "Este convite foi cancelado"],
    ["declined", "Este convite foi recusado"],
    ["not-found", "Este convite não é válido"],
    ["email-registered", "Este e-mail já tem uma conta"],
    ["unavailable", "Não foi possível abrir o convite"],
  ] as const)("dá ao estado %s um título próprio", (state, title) => {
    renderNotice(state);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  });

  it("sempre oferece uma saída para a tela de entrada", () => {
    renderNotice("used");

    expect(screen.getByRole("link", { name: "Ir para a entrada" })).toHaveAttribute("href", "/login");
  });

  it("explica no expirado que o convite vale 7 dias e que é preciso pedir outro link", () => {
    renderNotice("expired");

    expect(screen.getByText(/os convites valem 7 dias/)).toBeInTheDocument();
  });

  it("mostra no expirado para quem, por quem e quando o convite foi enviado", () => {
    renderNotice("expired", DETAILS);

    expect(screen.getByText("maria@example.com")).toBeInTheDocument();
    expect(screen.getByText("Marcos Oliveira")).toBeInTheDocument();
    expect(screen.getByText("14/10/2026")).toBeInTheDocument();
    expect(screen.getByText("21/10/2026")).toBeInTheDocument();
  });

  it("não mostra o resumo no expirado quando o back não mandou o contexto", () => {
    renderNotice("expired");

    expect(screen.queryByText("Enviado para")).not.toBeInTheDocument();
  });

  it("não mostra o resumo nos demais estados, mesmo que haja contexto", () => {
    renderNotice("used", DETAILS);

    expect(screen.queryByText("Enviado para")).not.toBeInTheDocument();
  });

  it("oferece o pedido de novo convite só no expirado", () => {
    renderNotice("revoked");

    expect(screen.queryByRole("button", { name: "Pedir novo convite" })).not.toBeInTheDocument();
  });

  it("pede o novo convite com o token do link e leva a Pedido enviado", async () => {
    renderNotice("expired", DETAILS);

    fireEvent.click(screen.getByRole("button", { name: "Pedir novo convite" }));

    expect(await screen.findByRole("heading", { name: "Pedido enviado" })).toBeInTheDocument();
    expect(requestRenewalAction).toHaveBeenCalledWith({ token: TOKEN });
    expect(
      screen.getByText("Marcos Oliveira recebeu seu pedido. Um novo link chegará em maria@example.com."),
    ).toBeInTheDocument();
  });

  it("fala de forma genérica em Pedido enviado quando o contexto do convite não veio", async () => {
    renderNotice("expired");

    fireEvent.click(screen.getByRole("button", { name: "Pedir novo convite" }));

    expect(await screen.findByText(/Quem convidou você recebeu seu pedido/)).toBeInTheDocument();
  });

  it("some com o aviso e a saída quando o pedido é enviado, e leva o foco para a confirmação", async () => {
    renderNotice("expired", DETAILS);

    fireEvent.click(screen.getByRole("button", { name: "Pedir novo convite" }));

    const heading = await screen.findByRole("heading", { name: "Pedido enviado" });
    expect(screen.queryByRole("link", { name: "Ir para a entrada" })).not.toBeInTheDocument();
    expect(screen.queryByText("Este convite expirou")).not.toBeInTheDocument();
    expect(heading.closest("[tabindex]")).toHaveFocus();
  });

  it("trava o botão enquanto o pedido é enviado, para não pedir duas vezes", async () => {
    let finish: (result: RequestRenewalResult) => void = () => undefined;
    requestRenewalAction.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderNotice("expired", DETAILS);

    fireEvent.click(screen.getByRole("button", { name: "Pedir novo convite" }));

    expect(await screen.findByRole("button", { name: /Enviando/ })).toBeDisabled();
    finish({ status: "requested" });
    await screen.findByRole("heading", { name: "Pedido enviado" });
  });

  it("mantém o aviso e a saída com mensagem quando o serviço falha, para tentar de novo", async () => {
    requestRenewalAction.mockResolvedValue({ status: "error", message: "Aguarde um pouco e tente de novo." });
    renderNotice("expired", DETAILS);

    fireEvent.click(screen.getByRole("button", { name: "Pedir novo convite" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Aguarde um pouco e tente de novo.");
    expect(screen.getByRole("heading", { name: "Este convite expirou" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pedir novo convite" })).toBeEnabled();
  });

  it("mostra uma mensagem quando a action nem chega a responder", async () => {
    requestRenewalAction.mockRejectedValue(new Error("Failed to fetch"));
    renderNotice("expired", DETAILS);

    fireEvent.click(screen.getByRole("button", { name: "Pedir novo convite" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível enviar o pedido agora");
    expect(screen.getByRole("button", { name: "Pedir novo convite" })).toBeEnabled();
  });

  it.each([
    ["used", "Este convite já foi usado"],
    ["declined", "Este convite foi recusado"],
    ["revoked", "Este convite foi cancelado"],
    ["email-registered", "Este e-mail já tem uma conta"],
  ] as const)("troca o aviso pelo estado verdadeiro quando o convite virou %s", async (state, title) => {
    requestRenewalAction.mockResolvedValue({ status: "rejected", rejection: { state, details: null } });
    renderNotice("expired", DETAILS);

    fireEvent.click(screen.getByRole("button", { name: "Pedir novo convite" }));

    expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Pedir novo convite" })).not.toBeInTheDocument());
  });

  it("no e-mail já cadastrado, manda entrar com a senha e fala em outra congregação", () => {
    renderNotice("email-registered");

    expect(screen.getByText(/Entre com a sua senha/)).toBeInTheDocument();
    expect(screen.getByText(/outra congregação/)).toBeInTheDocument();
  });

  it("não culpa o link quando a falha é do serviço", () => {
    renderNotice("unavailable");

    expect(screen.getByText(/ele continua valendo/)).toBeInTheDocument();
  });
});
