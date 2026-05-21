import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CreateEventFormModal } from "./create-event-form-modal";

describe("CreateEventFormModal", () => {
  it("renderiza os campos principais quando aberto", () => {
    render(<CreateEventFormModal open onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Novo Evento" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor da passagem")).toBeInTheDocument();
  });

  it("exibe data final ao selecionar congresso regional", () => {
    render(<CreateEventFormModal open onClose={vi.fn()} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "REGIONAL_CONVENTION" } });

    expect(screen.getByLabelText("Data final")).toBeInTheDocument();
  });

  it("envia valores válidos", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true });
    const onClose = vi.fn();

    render(<CreateEventFormModal open onClose={onClose} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Assembleia SP 2026" } });
    fireEvent.change(screen.getByLabelText("Valor da passagem"), { target: { value: "25.00" } });
    fireEvent.change(screen.getByLabelText("Nome do local"), { target: { value: "Salão Central" } });
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "São Paulo" } });
    fireEvent.change(screen.getByLabelText("Endereço"), { target: { value: "Rua das Flores, 100" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "SP" } });
    fireEvent.change(screen.getByLabelText("Data inicial"), { target: { value: "2026-07-10" } });
    fireEvent.change(screen.getByLabelText("Prazo de inscrição"), { target: { value: "2026-06-01" } });
    fireEvent.change(screen.getByLabelText("Prazo de pagamento"), { target: { value: "2026-06-15" } });

    fireEvent.click(screen.getByRole("button", { name: "Criar evento" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Assembleia SP 2026",
          type: "ASSEMBLY",
          ticketPrice: "25.00",
        }),
      );
    });
    expect(onClose).toHaveBeenCalled();
  });
});
