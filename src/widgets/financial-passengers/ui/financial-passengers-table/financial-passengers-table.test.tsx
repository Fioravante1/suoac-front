import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/lib")>()),
  formatCurrency: (value: string | number) => `R$ ${Number(value).toFixed(2)}`,
}));

import type { EventPassenger } from "@/entities/event-passenger";

import { FinancialPassengersTable } from "./financial-passengers-table";

function passenger(overrides: Partial<EventPassenger> = {}): EventPassenger {
  return {
    id: "ep-1",
    passenger: { id: "p-1", name: "João", rg: "123", phone: null },
    totalAmount: "100.00",
    paidAmount: "40.00",
    paymentStatus: "PARTIAL",
    exemptionReason: null,
    observations: null,
    eventId: "evt-1",
    congregationId: "c-1",
    registeredById: "u-1",
    createdAt: "",
    updatedAt: "",
    days: [],
    ...overrides,
  };
}

const congregationNameById = { "c-1": "Central" };
const noop = () => {};

describe("FinancialPassengersTable", () => {
  it("mostra empty state quando não há passageiros", () => {
    render(
      <FinancialPassengersTable
        passengers={[]}
        isCircuitUser
        congregationNameById={congregationNameById}
        page={1}
        totalPages={1}
        onPageChange={noop}
      />,
    );

    expect(screen.getByText("Nenhum passageiro")).toBeInTheDocument();
  });

  it("exibe a coluna Congregação para perfil de circuito", () => {
    render(
      <FinancialPassengersTable
        passengers={[passenger()]}
        isCircuitUser
        congregationNameById={congregationNameById}
        page={1}
        totalPages={1}
        onPageChange={noop}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Congregação" })).toBeInTheDocument();
    expect(screen.getAllByText("Central").length).toBeGreaterThan(0);
  });

  it("oculta a coluna Congregação para perfil de congregação", () => {
    render(
      <FinancialPassengersTable
        passengers={[passenger()]}
        isCircuitUser={false}
        congregationNameById={congregationNameById}
        page={1}
        totalPages={1}
        onPageChange={noop}
      />,
    );

    expect(screen.queryByRole("columnheader", { name: "Congregação" })).not.toBeInTheDocument();
  });

  it("mostra travessão no pendente de isentos", () => {
    render(
      <FinancialPassengersTable
        passengers={[passenger({ paymentStatus: "EXEMPT", totalAmount: "0.00", paidAmount: "0.00" })]}
        isCircuitUser={false}
        congregationNameById={congregationNameById}
        page={1}
        totalPages={1}
        onPageChange={noop}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
