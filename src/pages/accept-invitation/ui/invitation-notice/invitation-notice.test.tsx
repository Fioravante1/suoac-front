import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { InvitationNoticeState } from "../../model";

import { InvitationNotice } from "./invitation-notice";

const DETAILS = {
  email: "maria@example.com",
  invitedBy: "Marcos Oliveira",
  sentAt: "2026-10-14T12:00:00.000Z",
  expiresAt: "2026-10-21T12:00:00.000Z",
};

function renderNotice(state: InvitationNoticeState, details = null as typeof DETAILS | null) {
  return render(<InvitationNotice rejection={{ state, details }} />);
}

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

  it("não finge que o pedido foi enviado: avisa que ainda não está disponível e indica a quem recorrer", () => {
    renderNotice("expired", DETAILS);

    fireEvent.click(screen.getByRole("button", { name: "Pedir novo convite" }));

    expect(screen.getByRole("alert")).toHaveTextContent("ainda não está disponível");
    expect(screen.getByRole("alert")).toHaveTextContent("Fale diretamente com Marcos Oliveira");
  });

  it("indica quem convidou, de forma genérica, quando o contexto não veio", () => {
    renderNotice("expired");

    fireEvent.click(screen.getByRole("button", { name: "Pedir novo convite" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Fale diretamente com quem convidou você");
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
