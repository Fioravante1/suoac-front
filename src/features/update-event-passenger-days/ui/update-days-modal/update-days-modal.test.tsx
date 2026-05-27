import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EVENT_DAY_STATUSES, type EventDayInEvent } from "@/entities/event";

import { UpdateDaysModal } from "./update-days-modal";

const activeDays: EventDayInEvent[] = [
  {
    id: "day-1",
    dayNumber: 1,
    date: "2026-07-10T00:00:00.000Z",
    label: "Dia 1 - Sexta-feira",
    departureTime: "06:00",
    returnTime: "18:00",
    status: EVENT_DAY_STATUSES.ACTIVE,
    eventId: "event-1",
  },
  {
    id: "day-2",
    dayNumber: 2,
    date: "2026-07-11T00:00:00.000Z",
    label: "Dia 2 - Sábado",
    departureTime: "06:00",
    returnTime: "18:00",
    status: EVENT_DAY_STATUSES.ACTIVE,
    eventId: "event-1",
  },
  {
    id: "day-3",
    dayNumber: 3,
    date: "2026-07-12T00:00:00.000Z",
    label: "Dia 3 - Domingo",
    departureTime: "06:00",
    returnTime: "18:00",
    status: EVENT_DAY_STATUSES.CANCELLED,
    eventId: "event-1",
  },
];

describe("UpdateDaysModal", () => {
  it("renderiza título do modal", () => {
    render(
      <UpdateDaysModal open onClose={vi.fn()} onSubmit={vi.fn()} eventDays={activeDays} selectedDayIds={["day-1"]} />,
    );

    expect(screen.getByText("Editar dias da inscrição")).toBeInTheDocument();
  });

  it("mostra apenas dias ativos", () => {
    render(<UpdateDaysModal open onClose={vi.fn()} onSubmit={vi.fn()} eventDays={activeDays} selectedDayIds={[]} />);

    expect(screen.getByText("Dia 1 - Sexta-feira")).toBeInTheDocument();
    expect(screen.getByText("Dia 2 - Sábado")).toBeInTheDocument();
    expect(screen.queryByText("Dia 3 - Domingo")).not.toBeInTheDocument();
  });

  it("pré-seleciona os dias atuais", () => {
    render(
      <UpdateDaysModal open onClose={vi.fn()} onSubmit={vi.fn()} eventDays={activeDays} selectedDayIds={["day-1"]} />,
    );

    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("fecha ao clicar em cancelar", () => {
    const onClose = vi.fn();

    render(
      <UpdateDaysModal open onClose={onClose} onSubmit={vi.fn()} eventDays={activeDays} selectedDayIds={["day-1"]} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("permite alternar checkboxes", () => {
    render(
      <UpdateDaysModal open onClose={vi.fn()} onSubmit={vi.fn()} eventDays={activeDays} selectedDayIds={["day-1"]} />,
    );

    const checkboxes = screen.getAllByRole("checkbox");

    fireEvent.click(checkboxes[1]);

    expect(checkboxes[1]).toBeChecked();
  });

  it("mantém salvar desabilitado quando nenhum dia está selecionado", () => {
    render(<UpdateDaysModal open onClose={vi.fn()} onSubmit={vi.fn()} eventDays={activeDays} selectedDayIds={[]} />);

    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("envia os dias selecionados", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true });

    render(
      <UpdateDaysModal open onClose={vi.fn()} onSubmit={onSubmit} eventDays={activeDays} selectedDayIds={["day-1"]} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(["day-1"]);
    });
  });
});
