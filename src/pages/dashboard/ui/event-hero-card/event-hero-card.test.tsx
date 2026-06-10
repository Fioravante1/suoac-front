import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DashboardEvent } from "../../model";

import { EventHeroCard } from "./event-hero-card";

vi.mock("@/shared/lib", () => ({
  formatDate: (value: string) => value,
}));

vi.mock("@/shared/config", () => ({
  routes: {
    eventDetail: (id: string) => `/events/${id}`,
  },
}));

const mockEvent: DashboardEvent = {
  id: "evt-1",
  title: "Assembleia Regional 2025",
  type: "ASSEMBLY",
  status: "OPEN",
  ticketPrice: "50.00",
  venue: "Salao Norte",
  address: "Rua Exemplo, 100",
  city: "Curitiba",
  state: "PR",
  registrationDeadline: "2099-12-31",
  paymentDeadline: "2099-12-31",
  days: [
    { id: "day-1", date: "2099-12-01", label: "Dia 1", dayNumber: 1, status: "ACTIVE" },
    { id: "day-2", date: "2099-12-02", label: "Dia 2", dayNumber: 2, status: "ACTIVE" },
  ],
};

describe("EventHeroCard", () => {
  it("renderiza titulo e badge de status", () => {
    render(<EventHeroCard event={mockEvent} />);

    expect(screen.getByText("Assembleia Regional 2025")).toBeInTheDocument();
    expect(screen.getByText("Inscrições abertas")).toBeInTheDocument();
  });

  it("renderiza tipo do evento", () => {
    render(<EventHeroCard event={mockEvent} />);

    expect(screen.getByText("Assembleia")).toBeInTheDocument();
  });

  it("renderiza local do evento", () => {
    render(<EventHeroCard event={mockEvent} />);

    expect(screen.getByText("Salao Norte - Curitiba/PR")).toBeInTheDocument();
  });

  it("renderiza prazos de inscricao e pagamento", () => {
    render(<EventHeroCard event={mockEvent} />);

    expect(screen.getByText("Inscricao")).toBeInTheDocument();
    expect(screen.getByText("Pagamento")).toBeInTheDocument();
  });

  it("renderiza link 'Ver evento'", () => {
    render(<EventHeroCard event={mockEvent} />);

    const link = screen.getByText("Ver evento");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/events/evt-1");
  });

  it("nao renderiza botao de inscricao", () => {
    render(<EventHeroCard event={mockEvent} />);

    expect(screen.queryByRole("button", { name: /Inscrever passageiro/i })).not.toBeInTheDocument();
  });
});
