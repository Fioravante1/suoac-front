import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/lib")>()),
  formatCurrency: (value: string | number) => `R$ ${Number(value).toFixed(2)}`,
}));

import type { CongregationFinancial } from "@/entities/event-passenger";

import { CongregationFinancialList } from "./congregation-financial-list";

function congregation(name: string, pending: string): CongregationFinancial {
  return {
    congregationId: name,
    congregationName: name,
    totalPassengers: 10,
    totalExpected: "1000.00",
    totalReceived: "500.00",
    totalPending: pending,
    byStatus: { paid: 4, partial: 2, pending: 3, exempt: 1 },
  };
}

describe("CongregationFinancialList", () => {
  it("ordena por valor pendente decrescente", () => {
    render(
      <CongregationFinancialList
        congregations={[congregation("Norte", "100.00"), congregation("Central", "300.00")]}
      />,
    );

    const names = screen.getAllByText(/Norte|Central/).map((el) => el.textContent);
    expect(names[0]).toBe("Central");
    expect(names[1]).toBe("Norte");
  });

  it("exibe 'Quitado' quando não há pendente", () => {
    render(<CongregationFinancialList congregations={[congregation("Central", "0.00")]} />);

    expect(screen.getByText("Quitado")).toBeInTheDocument();
  });

  it("não renderiza nada quando a lista está vazia", () => {
    const { container } = render(<CongregationFinancialList congregations={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
