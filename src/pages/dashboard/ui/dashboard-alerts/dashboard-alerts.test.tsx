import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DashboardEvent } from "../../model";

import { DashboardAlerts } from "./dashboard-alerts";

vi.mock("@/shared/lib", () => ({
  formatCurrency: (value: string | number) => `R$ ${Number(value).toFixed(2)}`,
}));

function createEvent(overrides: Partial<DashboardEvent> = {}): DashboardEvent {
  return {
    id: "evt-1",
    title: "Assembleia",
    type: "ASSEMBLY",
    status: "OPEN",
    ticketPrice: "50.00",
    venue: "Salao",
    address: "Rua Exemplo, 100",
    city: "Curitiba",
    state: "PR",
    registrationDeadline: "2099-12-31",
    paymentDeadline: "2099-12-31",
    days: [],
    ...overrides,
  };
}

describe("DashboardAlerts", () => {
  it("retorna null quando nao ha alertas", () => {
    const { container } = render(
      <DashboardAlerts event={createEvent()} totalPendingPassengers={0} totalPending="0.00" />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("exibe alerta de inscricao expirada", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const event = createEvent({ registrationDeadline: past.toISOString().split("T")[0] });

    render(<DashboardAlerts event={event} totalPendingPassengers={0} totalPending="0.00" />);

    expect(screen.getByText(/prazo de inscricao expirou/)).toBeInTheDocument();
  });

  it("exibe alerta de inscricao proxima", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const event = createEvent({ registrationDeadline: soon.toISOString().split("T")[0] });

    render(<DashboardAlerts event={event} totalPendingPassengers={0} totalPending="0.00" />);

    expect(screen.getByText(/prazo de inscricao encerra/)).toBeInTheDocument();
  });

  it("exibe alerta de pagamento expirado com passageiros pendentes", () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    const event = createEvent({ paymentDeadline: past.toISOString().split("T")[0] });

    render(<DashboardAlerts event={event} totalPendingPassengers={3} totalPending="150.00" />);

    expect(screen.getByText(/prazo de pagamento expirou/)).toBeInTheDocument();
  });

  it("nao exibe alerta de pagamento quando nao ha passageiros pendentes", () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    const event = createEvent({ paymentDeadline: past.toISOString().split("T")[0] });

    const { container } = render(<DashboardAlerts event={event} totalPendingPassengers={0} totalPending="0.00" />);

    expect(container.querySelector(".alert")).toBeNull();
  });
});
