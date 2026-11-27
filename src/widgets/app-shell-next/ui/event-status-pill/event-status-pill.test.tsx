import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EVENT_STATUSES } from "@/entities/event";

import { EventStatusPill } from "./event-status-pill";

describe("EventStatusPill", () => {
  it.each([
    [EVENT_STATUSES.OPEN, "Inscrições abertas", "open"],
    [EVENT_STATUSES.CLOSED, "Inscrições encerradas", "closed"],
    [EVENT_STATUSES.FINISHED, "Finalizado", "finished"],
  ])("escreve o status %s por extenso, no tom do desenho", (status, label, tone) => {
    render(<EventStatusPill status={status} />);

    expect(screen.getByText(label)).toHaveAttribute("data-tone", tone);
  });

  it("usa o tom de rascunho", () => {
    render(<EventStatusPill status={EVENT_STATUSES.DRAFT} />);

    expect(screen.getByText("Rascunho")).toHaveAttribute("data-tone", "draft");
  });
  it("permite o rótulo de privacidade do rascunho", () => {
    render(<EventStatusPill status={EVENT_STATUSES.DRAFT} label="Rascunho · só você vê" />);
    expect(screen.getByText("Rascunho · só você vê")).toHaveAttribute("data-tone", "draft");
  });
  it("identifica o cancelamento com tom próprio", () => {
    render(<EventStatusPill status={EVENT_STATUSES.CANCELLED} />);
    expect(screen.getByText("Cancelado")).toHaveAttribute("data-tone", "cancelled");
  });
});
