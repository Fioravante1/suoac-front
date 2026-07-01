import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/lib")>()),
  formatCurrency: (value: string | number) => `R$ ${Number(value).toFixed(2)}`,
}));

import type { FinancialTotals } from "@/entities/event-passenger";

import { FinancialSummaryCards } from "./financial-summary-cards";

const totals: FinancialTotals = {
  totalPassengers: 48,
  totalExpected: "1000.00",
  totalReceived: "750.00",
  totalPending: "250.00",
  byStatus: { paid: 20, partial: 8, pending: 15, exempt: 5 },
};

describe("FinancialSummaryCards", () => {
  it("exibe os totais formatados", () => {
    render(<FinancialSummaryCards totals={totals} />);

    expect(screen.getByText("R$ 1000.00")).toBeInTheDocument();
    expect(screen.getByText("R$ 750.00")).toBeInTheDocument();
    expect(screen.getByText("R$ 250.00")).toBeInTheDocument();
  });

  it("calcula o percentual recebido", () => {
    render(<FinancialSummaryCards totals={totals} />);

    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "75");
  });

  it("trata pendente zero sem quebrar", () => {
    render(<FinancialSummaryCards totals={{ ...totals, totalReceived: "1000.00", totalPending: "0.00" }} />);

    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
