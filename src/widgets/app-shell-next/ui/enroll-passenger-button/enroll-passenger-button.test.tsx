import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EVENT_STATUSES, EVENT_TYPES, type Event } from "@/entities/event";

vi.mock("../enroll-passenger-dialog", () => ({
  EnrollPassengerDialog: ({ event, onClose }: { event: Event; onClose: () => void }) => (
    <div role="dialog" aria-label={`Inscrever passageiro em ${event.title}`}>
      <button type="button" onClick={onClose}>
        Fechar
      </button>
    </div>
  ),
}));

import { EnrollPassengerButton } from "./enroll-passenger-button";

const event = {
  id: "event-1",
  title: "Congresso Regional 2026",
  type: EVENT_TYPES.REGIONAL_CONVENTION,
  status: EVENT_STATUSES.OPEN,
} as Event;

describe("EnrollPassengerButton", () => {
  it("monta o modal de inscrição do evento só depois do clique", () => {
    render(<EnrollPassengerButton event={event} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar passageiro" }));

    expect(screen.getByRole("dialog", { name: "Inscrever passageiro em Congresso Regional 2026" })).toBeInTheDocument();
  });

  it("desmonta o modal quando ele fecha", () => {
    render(<EnrollPassengerButton event={event} />);

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar passageiro" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
