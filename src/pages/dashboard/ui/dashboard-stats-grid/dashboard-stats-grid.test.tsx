import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DashboardStats } from "../../model";

import { DashboardStatsGrid } from "./dashboard-stats-grid";

vi.mock("@/shared/lib", () => ({
  formatCurrency: (value: string | number) => `R$ ${Number(value).toFixed(2)}`,
}));

const mockStats: DashboardStats = {
  totalPassengers: 42,
  totalExpected: "2100.00",
  totalReceived: "1500.00",
  totalPending: "600.00",
};

describe("DashboardStatsGrid", () => {
  it("renderiza o total de inscritos", () => {
    render(<DashboardStatsGrid stats={mockStats} />);

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Inscritos")).toBeInTheDocument();
  });

  it("renderiza valor esperado formatado", () => {
    render(<DashboardStatsGrid stats={mockStats} />);

    expect(screen.getByText("R$ 2100.00")).toBeInTheDocument();
    expect(screen.getByText("Valor esperado")).toBeInTheDocument();
  });

  it("renderiza valor recebido formatado", () => {
    render(<DashboardStatsGrid stats={mockStats} />);

    expect(screen.getByText("R$ 1500.00")).toBeInTheDocument();
    expect(screen.getByText("Recebido")).toBeInTheDocument();
  });

  it("renderiza valor pendente formatado", () => {
    render(<DashboardStatsGrid stats={mockStats} />);

    expect(screen.getByText("R$ 600.00")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });
});
