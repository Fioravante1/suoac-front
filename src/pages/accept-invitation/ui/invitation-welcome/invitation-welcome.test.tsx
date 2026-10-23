import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { WelcomeSummary } from "../../model";

import { InvitationWelcome } from "./invitation-welcome";

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

describe("InvitationWelcome", () => {
  it("dá boas-vindas pelo primeiro nome", () => {
    render(<InvitationWelcome summary={SUMMARY} />);

    expect(screen.getByRole("heading", { name: "Bem-vindo, Ana!" })).toBeInTheDocument();
  });

  it("resume privilégio, congregação com código e login", () => {
    render(<InvitationWelcome summary={SUMMARY} />);

    expect(screen.getByText("Coordenador do arranjo de ônibus na congregação")).toBeInTheDocument();
    expect(screen.getByText("Jardim Paulista · 31245")).toBeInTheDocument();
    expect(screen.getByText("ana.souza@email.com")).toBeInTheDocument();
  });

  it("leva ao painel", () => {
    render(<InvitationWelcome summary={SUMMARY} />);

    expect(screen.getByRole("link", { name: "Entrar no painel" })).toHaveAttribute("href", "/dashboard");
  });

  it("diz que quem convidou foi avisado do aceite, como o desenho", () => {
    render(<InvitationWelcome summary={SUMMARY} />);

    expect(
      screen.getByText("Seu acesso está liberado. Marcos Oliveira foi avisado de que você aceitou o convite."),
    ).toBeInTheDocument();
  });
});
