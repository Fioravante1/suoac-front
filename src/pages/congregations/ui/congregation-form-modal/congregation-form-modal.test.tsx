import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Congregation } from "@/entities/congregation";

import { CongregationFormModal } from "./congregation-form-modal";

function buildCongregation(overrides: Partial<Congregation> = {}): Congregation {
  return {
    id: "congregation-1",
    code: "31245",
    name: "Jardim Paulista",
    email: null,
    city: "São Paulo",
    isActive: true,
    circuitId: "circuit-1",
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("CongregationFormModal", () => {
  it("salva a edição de uma congregação sem e-mail, sem obrigar a inventar um", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true });

    render(<CongregationFormModal open onClose={vi.fn()} onSubmit={onSubmit} congregation={buildCongregation()} />);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Jardim Paulista II" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "Jardim Paulista II", email: "" }));
    expect(screen.queryByText("E-mail inválido.")).not.toBeInTheDocument();
  });

  it("com e-mail cadastrado, ele continua obrigatório na edição", async () => {
    const onSubmit = vi.fn();

    render(
      <CongregationFormModal
        open
        onClose={vi.fn()}
        onSubmit={onSubmit}
        congregation={buildCongregation({ email: "jardim@example.com" })}
      />,
    );
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("E-mail inválido.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("no cadastro novo, o e-mail é obrigatório", async () => {
    const onSubmit = vi.fn();

    render(<CongregationFormModal open onClose={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect((await screen.findAllByText("E-mail inválido.")).length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
