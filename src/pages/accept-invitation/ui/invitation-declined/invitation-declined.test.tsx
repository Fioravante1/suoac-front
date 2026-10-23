import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InvitationDeclined } from "./invitation-declined";

describe("InvitationDeclined", () => {
  it("confirma a recusa", () => {
    render(<InvitationDeclined invitedBy="Marcos Oliveira" />);

    expect(screen.getByRole("heading", { name: "Convite recusado" })).toBeInTheDocument();
  });

  it("diz quem foi avisado e que a página pode ser fechada", () => {
    render(<InvitationDeclined invitedBy="Marcos Oliveira" />);

    expect(screen.getByText("Avisamos Marcos Oliveira. Você pode fechar esta página.")).toBeInTheDocument();
  });

  it("não oferece saída: quem recusou não tem conta nem para onde ir", () => {
    render(<InvitationDeclined invitedBy="Marcos Oliveira" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
