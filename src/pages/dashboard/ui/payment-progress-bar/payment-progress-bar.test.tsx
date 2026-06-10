import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DashboardPaymentBreakdown } from "../../model";

import { PaymentProgressBar } from "./payment-progress-bar";

const mockBreakdown: DashboardPaymentBreakdown = {
  paid: 20,
  partial: 5,
  pending: 10,
  exempt: 5,
};

describe("PaymentProgressBar", () => {
  it("renderiza titulo e porcentagem", () => {
    render(<PaymentProgressBar breakdown={mockBreakdown} />);

    expect(screen.getByText("Pagamentos")).toBeInTheDocument();
    expect(screen.getByText("63% quitado")).toBeInTheDocument();
  });

  it("renderiza legenda com contagem de cada status", () => {
    render(<PaymentProgressBar breakdown={mockBreakdown} />);

    expect(screen.getByText("Pago: 20")).toBeInTheDocument();
    expect(screen.getByText("Parcial: 5")).toBeInTheDocument();
    expect(screen.getByText("Pendente: 10")).toBeInTheDocument();
    expect(screen.getByText("Isento: 5")).toBeInTheDocument();
  });

  it("retorna null quando total e zero", () => {
    const emptyBreakdown: DashboardPaymentBreakdown = {
      paid: 0,
      partial: 0,
      pending: 0,
      exempt: 0,
    };

    const { container } = render(<PaymentProgressBar breakdown={emptyBreakdown} />);
    expect(container.innerHTML).toBe("");
  });
});
