import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EVENT_STATUSES, EVENT_TYPES, type Event } from "@/entities/event";
import { USER_ROLES } from "@/shared/auth";

import { UpdateEventFormModal } from "./update-event-form-modal";

const baseEvent: Event = {
  id: "event-1",
  title: "Assembleia SP 2026",
  type: EVENT_TYPES.ASSEMBLY,
  ticketPrice: "25.00",
  status: EVENT_STATUSES.DRAFT,
  registrationDeadline: "2026-06-01T00:00:00.000Z",
  paymentDeadline: "2026-06-15T00:00:00.000Z",
  venue: "Salão Central",
  address: "Rua das Flores, 100",
  city: "São Paulo",
  state: "SP",
  observations: null,
  circuitId: "circuit-1",
  createdById: "user-1",
  createdAt: "2026-05-21T00:00:00.000Z",
  updatedAt: "2026-05-21T00:00:00.000Z",
};

describe("UpdateEventFormModal", () => {
  it("renderiza valores do evento", () => {
    render(
      <UpdateEventFormModal
        open
        event={baseEvent}
        userRole={USER_ROLES.CIRCUIT_COORDINATOR}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Assembleia SP 2026")).toBeInTheDocument();
    expect(screen.getByDisplayValue("25.00")).toBeInTheDocument();
  });

  it("libera todos os campos para coordenador em evento aberto sem mensagem de restrição", () => {
    render(
      <UpdateEventFormModal
        open
        event={{ ...baseEvent, status: EVENT_STATUSES.OPEN }}
        userRole={USER_ROLES.CIRCUIT_COORDINATOR}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Prazo de inscrição")).not.toBeDisabled();
    expect(screen.getByLabelText("Prazo de pagamento")).not.toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("desabilita prazos e exibe aviso para assistente em evento aberto", () => {
    render(
      <UpdateEventFormModal
        open
        event={{ ...baseEvent, status: EVENT_STATUSES.OPEN }}
        userRole={USER_ROLES.CIRCUIT_ASSISTANT}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Prazo de inscrição")).toBeDisabled();
    expect(screen.getByLabelText("Prazo de pagamento")).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/coordenador do arranjo de ônibus/i);
  });

  it("envia valores válidos", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true, data: baseEvent });
    const onClose = vi.fn();

    render(
      <UpdateEventFormModal
        open
        event={baseEvent}
        userRole={USER_ROLES.CIRCUIT_COORDINATOR}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Novo título" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(baseEvent, expect.objectContaining({ title: "Novo título" }));
    });
    expect(onClose).toHaveBeenCalled();
  });
});
