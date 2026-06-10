import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DashboardPendingPassenger } from "../../model";

import { PendingPassengersList } from "./pending-passengers-list";

vi.mock("@/shared/lib", () => ({
  formatCurrency: (value: string | number) => `R$ ${Number(value).toFixed(2)}`,
}));

vi.mock("@/shared/config", () => ({
  routes: {
    eventDetail: (id: string) => `/events/${id}`,
  },
}));

const mockPassengers: DashboardPendingPassenger[] = [
  {
    id: "p-1",
    passengerName: "Maria Silva",
    totalAmount: "100.00",
    paidAmount: "50.00",
    pendingAmount: "50.00",
    paymentStatus: "PENDING",
  },
  {
    id: "p-2",
    passengerName: "Jose Santos",
    totalAmount: "50.00",
    paidAmount: "25.00",
    pendingAmount: "25.00",
    paymentStatus: "PARTIAL",
  },
];

describe("PendingPassengersList", () => {
  it("renderiza lista de passageiros pendentes", () => {
    render(<PendingPassengersList passengers={mockPassengers} totalPendingPassengers={2} eventId="evt-1" />);

    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("Jose Santos")).toBeInTheDocument();
  });

  it("renderiza valores pendentes formatados", () => {
    render(<PendingPassengersList passengers={mockPassengers} totalPendingPassengers={2} eventId="evt-1" />);

    expect(screen.getByText("R$ 50.00")).toBeInTheDocument();
    expect(screen.getByText("R$ 25.00")).toBeInTheDocument();
  });

  it("renderiza badges de status de pagamento", () => {
    render(<PendingPassengersList passengers={mockPassengers} totalPendingPassengers={2} eventId="evt-1" />);

    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.getByText("Parcial")).toBeInTheDocument();
  });

  it("exibe link 'Ver todos' quando ha mais passageiros que os listados", () => {
    render(<PendingPassengersList passengers={mockPassengers} totalPendingPassengers={10} eventId="evt-1" />);

    const link = screen.getByText("Ver todos (10)");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/events/evt-1");
  });

  it("nao exibe link 'Ver todos' quando todos estao listados", () => {
    render(<PendingPassengersList passengers={mockPassengers} totalPendingPassengers={2} eventId="evt-1" />);

    expect(screen.queryByText(/Ver todos/)).not.toBeInTheDocument();
  });

  it("exibe empty state com mensagem de sucesso quando lista esta vazia", () => {
    render(<PendingPassengersList passengers={[]} totalPendingPassengers={0} eventId="evt-1" />);

    expect(screen.getByText("Todos os passageiros estao em dia!")).toBeInTheDocument();
  });
});
