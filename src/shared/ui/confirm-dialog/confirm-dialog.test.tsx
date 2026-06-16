import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ConfirmDialog } from "./confirm-dialog";

function setup(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  render(
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      title="Excluir passageiro"
      message="Tem certeza?"
      confirmLabel="Excluir"
      variant="destructive"
      {...overrides}
    />,
  );

  return { onClose, onConfirm };
}

describe("ConfirmDialog", () => {
  it("não renderiza nada quando fechado", () => {
    render(<ConfirmDialog open={false} onClose={vi.fn()} onConfirm={vi.fn()} title="Título" message="Mensagem" />);

    expect(screen.queryByText("Mensagem")).not.toBeInTheDocument();
  });

  it("renderiza título, mensagem e ações", () => {
    setup();

    expect(screen.getByText("Excluir passageiro")).toBeInTheDocument();
    expect(screen.getByText("Tem certeza?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("dispara onConfirm e onClose ao clicar nas ações", () => {
    const { onClose, onConfirm } = setup();

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onConfirm).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("exibe o spinner e desabilita as ações enquanto carrega", () => {
    setup({ loading: true });

    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Excluir/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("usa o loadingLabel no botão de confirmar enquanto carrega", () => {
    setup({ loading: true, loadingLabel: "Excluindo..." });

    expect(screen.getByRole("button", { name: /Excluindo\.\.\./ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
  });
});
