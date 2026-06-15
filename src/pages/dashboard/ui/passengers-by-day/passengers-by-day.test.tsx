import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DashboardDayCount } from "../../model";

import { PassengersByDay } from "./passengers-by-day";

const mockDays: DashboardDayCount[] = [
  { eventDayId: "d1", dayNumber: 1, label: "Dia 1 - Sexta-feira", date: "2026-07-10", totalPassengers: 40 },
  { eventDayId: "d2", dayNumber: 2, label: "Dia 2 - Sabado", date: "2026-07-11", totalPassengers: 33 },
  { eventDayId: "d3", dayNumber: 3, label: "Dia 3 - Domingo", date: "2026-07-12", totalPassengers: 0 },
];

describe("PassengersByDay", () => {
  it("renderiza uma coluna por dia com o numero exato", () => {
    render(<PassengersByDay days={mockDays} totalPassengers={50} />);

    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("33")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renderiza o dia da semana abreviado de cada coluna (derivado da data)", () => {
    render(<PassengersByDay days={mockDays} totalPassengers={50} />);

    expect(screen.getByText("Sex")).toBeInTheDocument();
    expect(screen.getByText("Sáb")).toBeInTheDocument();
    expect(screen.getByText("Dom")).toBeInTheDocument();
  });

  it("ancora a barra ao total de inscritos (meter com total como maximo)", () => {
    render(<PassengersByDay days={mockDays} totalPassengers={50} />);

    const meters = screen.getAllByRole("meter");
    expect(meters).toHaveLength(3);
    expect(meters[0]).toHaveAttribute("aria-valuenow", "40");
    expect(meters[0]).toHaveAttribute("aria-valuemax", "50");
  });

  it("renderiza o titulo e a nota ancorada ao total", () => {
    render(<PassengersByDay days={mockDays} totalPassengers={50} />);

    expect(screen.getByText("Presença por dia")).toBeInTheDocument();
    expect(screen.getByText("De 50 inscritos, quantos vão em cada dia")).toBeInTheDocument();
  });

  it("retorna null quando nao ha dias (evento de um dia)", () => {
    const { container } = render(<PassengersByDay days={[]} totalPassengers={50} />);

    expect(container.innerHTML).toBe("");
  });

  it("nao quebra quando o total e zero", () => {
    render(<PassengersByDay days={mockDays} totalPassengers={0} />);

    expect(screen.getByText("Sex")).toBeInTheDocument();
  });
});
