import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InvitationRenewalSent } from "./invitation-renewal-sent";

describe("InvitationRenewalSent", () => {
  it("confirma o pedido", () => {
    render(<InvitationRenewalSent invitedBy="Marcos Oliveira" email="maria@example.com" />);

    expect(screen.getByRole("heading", { name: "Pedido enviado" })).toBeInTheDocument();
  });

  it("diz quem recebeu o pedido e para qual e-mail o novo link vai", () => {
    render(<InvitationRenewalSent invitedBy="Marcos Oliveira" email="maria@example.com" />);

    expect(
      screen.getByText("Marcos Oliveira recebeu seu pedido. Um novo link chegará em maria@example.com."),
    ).toBeInTheDocument();
  });

  it("fala de forma genérica quando o back não mandou o contexto do convite", () => {
    render(<InvitationRenewalSent invitedBy={null} email={null} />);

    expect(
      screen.getByText("Quem convidou você recebeu seu pedido. Um novo link chegará no e-mail do convite."),
    ).toBeInTheDocument();
  });

  it("não promete link já enviado nem oferece saída", () => {
    render(<InvitationRenewalSent invitedBy="Marcos Oliveira" email="maria@example.com" />);

    expect(screen.queryByText(/foi enviado/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
