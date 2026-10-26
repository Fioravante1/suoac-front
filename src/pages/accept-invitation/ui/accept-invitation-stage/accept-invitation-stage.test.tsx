import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Invitation } from "@/entities/invitation";

vi.mock("@/widgets/auth-shell", () => ({
  AuthShell: ({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) => (
    <div>
      <div data-testid="aside">{aside}</div>
      {children}
    </div>
  ),
  BrandPanelFrame: ({ children }: { children: React.ReactNode }) => <aside>{children}</aside>,
}));

let declineFromFlow: () => void = () => undefined;

vi.mock("../accept-invitation-flow", () => ({
  AcceptInvitationFlow: ({ token, onDeclined }: { token: string; onDeclined: () => void }) => {
    declineFromFlow = onDeclined;

    return <form data-testid="flow">{token}</form>;
  },
}));

const { AcceptInvitationStage } = await import("./accept-invitation-stage");

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

describe("AcceptInvitationStage", () => {
  it("abre com o fluxo de aceite e o cartão aguardando o convidado", () => {
    render(<AcceptInvitationStage token={TOKEN} invitation={INVITATION} />);

    expect(screen.getByTestId("flow")).toHaveTextContent(TOKEN);
    expect(screen.getByText("Aguardando você")).toBeInTheDocument();
    expect(screen.getByText("Convite válido até 30/10/2026")).toBeInTheDocument();
  });

  it("troca o fluxo pela confirmação e o selo do cartão por Recusado quando o convite é recusado", () => {
    render(<AcceptInvitationStage token={TOKEN} invitation={INVITATION} />);

    act(() => declineFromFlow());

    expect(screen.queryByTestId("flow")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Convite recusado" })).toBeInTheDocument();
    expect(screen.getByText("Recusado")).toBeInTheDocument();
    expect(screen.queryByText("Aguardando você")).not.toBeInTheDocument();
    expect(screen.getByText("Convite recusado hoje")).toBeInTheDocument();
  });

  it("leva o foco para a confirmação, que ocupa o lugar do formulário", () => {
    render(<AcceptInvitationStage token={TOKEN} invitation={INVITATION} />);

    act(() => declineFromFlow());

    expect(screen.getByRole("heading", { name: "Convite recusado" }).closest("[tabindex]")).toHaveFocus();
  });
});
