import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DashboardCongregationSummary } from "../../model";

import { CongregationSummaryList } from "./congregation-summary-list";

vi.mock("@/shared/lib", () => ({
  formatCurrency: (value: string | number) => `R$ ${Number(value).toFixed(2)}`,
}));

const mockSummaries: DashboardCongregationSummary[] = [
  {
    id: "cong-1",
    name: "Central",
    totalPassengers: 15,
    totalExpected: "750.00",
    totalReceived: "600.00",
    paymentStatus: "partial",
  },
  {
    id: "cong-2",
    name: "Norte",
    totalPassengers: 8,
    totalExpected: "400.00",
    totalReceived: "400.00",
    paymentStatus: "paid",
  },
  {
    id: "cong-3",
    name: "Sul",
    totalPassengers: 1,
    totalExpected: "50.00",
    totalReceived: "0.00",
    paymentStatus: "pending",
  },
];

describe("CongregationSummaryList", () => {
  it("renderiza lista de congregacoes", () => {
    render(<CongregationSummaryList summaries={mockSummaries} />);

    expect(screen.getByText("Central")).toBeInTheDocument();
    expect(screen.getByText("Norte")).toBeInTheDocument();
    expect(screen.getByText("Sul")).toBeInTheDocument();
  });

  it("renderiza contagem de passageiros com plural correto", () => {
    render(<CongregationSummaryList summaries={mockSummaries} />);

    expect(screen.getByText("15 passageiros")).toBeInTheDocument();
    expect(screen.getByText("8 passageiros")).toBeInTheDocument();
    expect(screen.getByText("1 passageiro")).toBeInTheDocument();
  });

  it("renderiza valores financeiros formatados", () => {
    render(<CongregationSummaryList summaries={mockSummaries} />);

    expect(screen.getByText("R$ 600.00")).toBeInTheDocument();
    expect(screen.getByText("de R$ 750.00")).toBeInTheDocument();
  });

  it("renderiza badges de status de pagamento", () => {
    render(<CongregationSummaryList summaries={mockSummaries} />);

    expect(screen.getByText("Parcial")).toBeInTheDocument();
    expect(screen.getByText("Pago")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("retorna null quando lista esta vazia", () => {
    const { container } = render(<CongregationSummaryList summaries={[]} />);

    expect(container.innerHTML).toBe("");
  });

  it("renderiza titulo da secao", () => {
    render(<CongregationSummaryList summaries={mockSummaries} />);

    expect(screen.getByText("Congregacoes")).toBeInTheDocument();
  });
});
