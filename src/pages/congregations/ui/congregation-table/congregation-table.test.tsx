import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Congregation } from "@/entities/congregation";

import { CongregationTable } from "./congregation-table";

function buildCongregation(overrides: Partial<Congregation> = {}): Congregation {
  return {
    id: "congregation-1",
    code: "31245",
    name: "Jardim Paulista",
    email: "Jardim.Paulista@Example.com",
    city: "São Paulo",
    isActive: true,
    circuitId: "circuit-1",
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-01T12:00:00.000Z",
    ...overrides,
  };
}

function renderTable(congregations: Congregation[]) {
  return render(<CongregationTable congregations={congregations} onEdit={vi.fn()} onDelete={vi.fn()} />);
}

describe("CongregationTable", () => {
  it("mostra o e-mail em minúsculas", () => {
    renderTable([buildCongregation()]);

    expect(screen.getAllByText("jardim.paulista@example.com").length).toBeGreaterThan(0);
  });

  it("não quebra com a congregação sem e-mail, que a API devolve como null", () => {
    renderTable([buildCongregation({ email: null })]);

    const row = screen.getByRole("row", { name: /Jardim Paulista/ });

    expect(within(row).getByText("Jardim Paulista")).toBeInTheDocument();
    expect(within(row).getAllByText("—").length).toBeGreaterThan(0);
  });

  it("no cartão do celular, deixa de fora a linha do e-mail quando ele não existe", () => {
    renderTable([buildCongregation({ email: null, city: null })]);

    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.getByText("Código: 31245")).toBeInTheDocument();
  });
});
