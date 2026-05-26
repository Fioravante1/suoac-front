import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Passenger } from "@/entities/passenger";

import { PassengerTable } from "./passenger-table";

const passenger: Passenger = {
  id: "passenger-1",
  name: "João Silva",
  rg: "12345678X",
  phone: null,
  observations: null,
  congregationId: "congregation-1",
  createdAt: "2026-05-26T14:30:00.000Z",
  updatedAt: "2026-05-26T14:30:00.000Z",
};

describe("PassengerTable", () => {
  it("renderiza dados do passageiro", () => {
    render(<PassengerTable passengers={[passenger]} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getAllByText("João Silva")[0]).toBeInTheDocument();
    expect(screen.getAllByText("12345678X")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Sem telefone")[0]).toBeInTheDocument();
  });

  it("dispara ação de edição", () => {
    const onEdit = vi.fn();
    render(<PassengerTable passengers={[passenger]} onEdit={onEdit} onDelete={vi.fn()} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Editar João Silva" })[0]);

    expect(onEdit).toHaveBeenCalledWith(passenger);
  });
});
