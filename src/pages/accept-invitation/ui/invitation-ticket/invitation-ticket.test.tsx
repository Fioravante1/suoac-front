import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InvitationTicket, type TicketInvitation } from "./invitation-ticket";

const COORDINATOR_INVITATION: TicketInvitation = {
  role: "CONGREGATION_COORDINATOR",
  invitedBy: "Marcos Oliveira",
  circuit: "SP-17",
  circuitCity: "Campinas",
  circuitState: "SP",
  congregation: "Jardim Paulista",
  congregationCode: "31245",
};

function renderTicket(invitation = COORDINATOR_INVITATION, badge: "pending" | "accepted" | "declined" = "pending") {
  return render(<InvitationTicket invitation={invitation} badge={badge} footnote="Convite válido até 30/10/2026" />);
}

describe("InvitationTicket", () => {
  it("diz quem convidou no título, pelo primeiro nome", () => {
    renderTicket();

    expect(
      screen.getByRole("heading", { level: 1, name: "Marcos convidou você para o arranjo de ônibus." }),
    ).toBeInTheDocument();
  });

  it("identifica o privilégio pelo nome completo, não pelo código do papel", () => {
    renderTicket();

    expect(screen.getByText("Coordenador do arranjo de ônibus na congregação")).toBeInTheDocument();
  });

  it("mostra a congregação com o código e o circuito com a cidade", () => {
    renderTicket();

    expect(screen.getByText("Jardim Paulista")).toBeInTheDocument();
    expect(screen.getByText("Código 31245")).toBeInTheDocument();
    expect(screen.getByText("SP-17")).toBeInTheDocument();
    expect(screen.getByText("Campinas · SP")).toBeInTheDocument();
  });

  it("mostra quem enviou o convite e com qual papel", () => {
    renderTicket();

    expect(screen.getByText("Enviado por Marcos Oliveira")).toBeInTheDocument();
    expect(screen.getByText("Coordenador do arranjo de ônibus no circuito")).toBeInTheDocument();
  });

  it("não mostra linha de coordenador a auxiliar: só o coordenador entra por convite", () => {
    renderTicket();

    expect(screen.queryByText(/Você vai auxiliar/)).not.toBeInTheDocument();
  });

  it("espera o convidado enquanto o convite está pendente", () => {
    renderTicket(COORDINATOR_INVITATION, "pending");

    expect(screen.getByText("Aguardando você")).toBeInTheDocument();
  });

  it("carimba o convite como aceito depois do aceite", () => {
    renderTicket(COORDINATOR_INVITATION, "accepted");

    expect(screen.getByText("Aceito")).toBeInTheDocument();
    expect(screen.queryByText("Aguardando você")).not.toBeInTheDocument();
  });

  it("marca o convite como recusado depois da recusa", () => {
    renderTicket(COORDINATOR_INVITATION, "declined");

    expect(screen.getByText("Recusado")).toBeInTheDocument();
    expect(screen.queryByText("Aguardando você")).not.toBeInTheDocument();
    expect(screen.queryByText("Aceito")).not.toBeInTheDocument();
  });

  it("assina a linha de rodapé do cartão", () => {
    renderTicket();

    expect(screen.getByText("Convite válido até 30/10/2026")).toBeInTheDocument();
  });

  it("usa as iniciais de quem enviou como avatar decorativo", () => {
    renderTicket();

    const sender = screen.getByText("Enviado por Marcos Oliveira").closest("div") as HTMLElement;

    expect(within(sender).getByText("MO")).toHaveAttribute("aria-hidden", "true");
  });

  it("mantém o papel desconhecido legível, em vez de esconder o privilégio", () => {
    renderTicket({ ...COORDINATOR_INVITATION, role: "PAPEL_NOVO" });

    expect(screen.getByText("PAPEL_NOVO")).toBeInTheDocument();
  });
});
