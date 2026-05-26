import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PassengerFormModal } from "./passenger-form-modal";

describe("PassengerFormModal", () => {
  it("submete dados válidos do passageiro", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true });
    render(<PassengerFormModal open onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "João Silva" } });
    fireEvent.change(screen.getByLabelText("RG"), { target: { value: "12.345.678-X" } });
    fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "11999999999" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "João Silva",
          rg: "12.345.678-X",
          phone: "11999999999",
        }),
      );
    });
  });

  it("exibe erro do servidor quando onSubmit retorna falha", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: false, error: "RG duplicado" });
    render(<PassengerFormModal open onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "João Silva" } });
    fireEvent.change(screen.getByLabelText("RG"), { target: { value: "12.345.678-X" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("RG duplicado");
    });
  });
});
