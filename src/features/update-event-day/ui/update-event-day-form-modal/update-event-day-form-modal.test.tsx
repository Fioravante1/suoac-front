import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EVENT_DAY_STATUSES, type EventDayInEvent } from "@/entities/event";

import { UpdateEventDayFormModal } from "./update-event-day-form-modal";

const baseDay: EventDayInEvent = {
  id: "day-1",
  dayNumber: 1,
  date: "2026-07-10T00:00:00.000Z",
  label: "Dia 1 - Sexta-feira",
  departureTime: "06:00",
  returnTime: "18:00",
  status: EVENT_DAY_STATUSES.ACTIVE,
  eventId: "event-1",
};

describe("UpdateEventDayFormModal", () => {
  it("renderiza valores do dia no formulário", () => {
    render(<UpdateEventDayFormModal open onClose={vi.fn()} onSubmit={vi.fn()} day={baseDay} />);

    expect(screen.getByDisplayValue("06:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("18:00")).toBeInTheDocument();
  });

  it("exibe o label do dia no título", () => {
    render(<UpdateEventDayFormModal open onClose={vi.fn()} onSubmit={vi.fn()} day={baseDay} />);

    expect(screen.getByText(/Dia 1 - Sexta-feira/)).toBeInTheDocument();
  });

  it("envia valores válidos ao submeter", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true });
    const onClose = vi.fn();

    render(<UpdateEventDayFormModal open onClose={onClose} onSubmit={onSubmit} day={baseDay} />);

    fireEvent.change(screen.getByLabelText("Horário de saída"), { target: { value: "07:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(baseDay, expect.objectContaining({ departureTime: "07:00" }));
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("exibe erro do servidor", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: false, error: "Falha no servidor" });

    render(<UpdateEventDayFormModal open onClose={vi.fn()} onSubmit={onSubmit} day={baseDay} />);

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Falha no servidor");
    });
  });

  it("fecha ao clicar em cancelar", () => {
    const onClose = vi.fn();

    render(<UpdateEventDayFormModal open onClose={onClose} onSubmit={vi.fn()} day={baseDay} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
  });
});
