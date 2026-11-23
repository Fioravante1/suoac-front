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

  it("usa o tom neutro para os status que o resumo ainda não desenha", () => {
    render(<EventStatusPill status={EVENT_STATUSES.DRAFT} />);

    expect(screen.getByText("Rascunho")).toHaveAttribute("data-tone", "neutral");
  });
});
