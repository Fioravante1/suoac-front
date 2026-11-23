import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { EventTimeline } from "../../model";

import { EventStepper } from "./event-stepper";

const closedTimeline: EventTimeline = {
  stages: [
    {
      key: "registrationOpen",
      state: "done",
      detail: "desde 21/09",
      compactDetail: "desde 21/09",
      isDeadlineAhead: false,
    },
    { key: "registrationClosed", state: "current", detail: null, compactDetail: "encerradas", isDeadlineAhead: false },
    { key: "event", state: "upcoming", detail: "23 a 25/10", compactDetail: "23 a 25/10", isDeadlineAhead: false },
    { key: "finished", state: "upcoming", detail: "após 25/10", compactDetail: "após 25/10", isDeadlineAhead: false },
  ],
  segments: [1, 0, 0],
  isLive: true,
};

function steps() {
  return within(screen.getByRole("list", { name: "Etapas do evento" })).getAllByRole("listitem");
}

describe("EventStepper", () => {
  it("lista as quatro etapas com os rótulos curtos e o apoio do celular", () => {
    render(<EventStepper timeline={closedTimeline} />);

    expect(steps().map((step) => step.textContent)).toEqual([
      "Abertas (concluída)desde 21/09",
      "Encerram (etapa atual)encerradas",
      "Evento (a seguir)23 a 25/10",
      "Finalizado (a seguir)após 25/10",
    ]);
  });

  it("marca a etapa atual para leitor de tela", () => {
    render(<EventStepper timeline={closedTimeline} />);

    expect(steps()[1]).toHaveAttribute("aria-current", "step");
    expect(steps()[0]).not.toHaveAttribute("aria-current");
  });

  it("preenche o trilho até onde o evento chegou, sobre os três trechos", () => {
    render(<EventStepper timeline={closedTimeline} />);

    const stepper = screen.getByRole("list", { name: "Etapas do evento" });

    expect(Number(stepper.style.getPropertyValue("--stepper-progress"))).toBeCloseTo(1 / 3);
  });

  it("usa os marcadores compactos, com o atual pulsando enquanto o evento está em andamento", () => {
    const { container } = render(<EventStepper timeline={closedTimeline} />);

    expect(container.querySelectorAll("[data-compact]")).toHaveLength(4);
    expect(container.querySelectorAll("[data-pulsing]")).toHaveLength(1);
  });
});
