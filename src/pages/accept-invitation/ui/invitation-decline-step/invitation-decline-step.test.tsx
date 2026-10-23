import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InvitationDeclineStep } from "./invitation-decline-step";

function renderStep(onBack = vi.fn()) {
  render(
    <InvitationDeclineStep
      invitedBy="Marcos Oliveira"
      congregation="Jardim Paulista"
      expiresAt="2026-10-30T12:00:00.000Z"
      onBack={onBack}
    />,
  );

  return onBack;
}

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
    const onBack = renderStep();

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("não finge que recusou: explica que ainda não está disponível e que o convite expira sozinho", async () => {
    renderStep();
    fireEvent.click(screen.getByRole("radio", { name: "Recebi por engano" }));

    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));

    const alert = await screen.findByRole("alert");
    await waitFor(() => expect(alert).toHaveTextContent("Recusar convite ainda não está disponível"));
    expect(alert).toHaveTextContent("expira em 30/10/2026");
    expect(alert).toHaveTextContent("avise Marcos Oliveira");
  });

  it("não mostra o aviso de indisponível antes de confirmar", () => {
    renderStep();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
