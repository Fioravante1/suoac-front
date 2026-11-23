import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { EventTimeline as EventTimelineData } from "../../model";

import { EventTimeline } from "./event-timeline";

const summary = {
  dayTiles: [
    { id: "day-1", weekday: "Sex", day: "23" },
    { id: "day-2", weekday: "Sáb", day: "24" },
  ],
  countdown: "Faltam 16 dias",
  months: "outubro de 2026",
};

const openTimeline: EventTimelineData = {
  stages: [
    {
      key: "registrationOpen",
      state: "current",
      detail: "desde 21/09",
      compactDetail: "desde 21/09",
      isDeadlineAhead: false,
    },
    {
      key: "registrationClosed",
      state: "upcoming",
      detail: "12/10 · em 5 dias",
      compactDetail: "12/10 · 5 dias",
      isDeadlineAhead: true,
    },
    { key: "event", state: "upcoming", detail: "23 a 24/10", compactDetail: "23 a 24/10", isDeadlineAhead: false },
    { key: "finished", state: "upcoming", detail: "após 24/10", compactDetail: "após 24/10", isDeadlineAhead: false },
  ],
  segments: [0.76, 0, 0],
  isLive: true,
};

function stagesList() {
  return screen.getByRole("list", { name: "Etapas do evento" });
}

describe("EventTimeline", () => {
  it("mostra os dias, a contagem regressiva e o mês do evento", () => {
    render(<EventTimeline summary={summary} timeline={openTimeline} />);

    expect(screen.getByRole("list", { name: "Dias do evento" })).toBeInTheDocument();
    expect(screen.getByText("Faltam 16 dias")).toBeInTheDocument();
    expect(screen.getByText("outubro de 2026")).toBeInTheDocument();
  });

  it("sem a contagem, no dia do evento e depois dele, deixa o mês no lugar dela", () => {
    render(<EventTimeline summary={{ ...summary, countdown: null }} timeline={openTimeline} />);

    expect(screen.queryByText(/Faltam/)).not.toBeInTheDocument();
    expect(screen.getAllByText("outubro de 2026")).toHaveLength(1);
  });

  it("lista as quatro etapas com os rótulos do desktop e as linhas de apoio", () => {
    render(<EventTimeline summary={summary} timeline={openTimeline} />);

    const stages = within(stagesList()).getAllByRole("listitem");

    expect(stages.map((stage) => stage.textContent)).toEqual([
      "Inscrições abertas (etapa atual)desde 21/09",
      "Inscrições encerradas (a seguir)12/10 · em 5 dias",
      "Evento (a seguir)23 a 24/10",
      "Finalizado (a seguir)após 24/10",
    ]);
  });

  it("marca a etapa atual para leitor de tela", () => {
    render(<EventTimeline summary={summary} timeline={openTimeline} />);

    const current = within(stagesList())
      .getAllByRole("listitem")
      .filter((stage) => stage.getAttribute("aria-current") === "step");

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Inscrições abertas");
  });

  it("destaca o encerramento que ainda vem", () => {
    render(<EventTimeline summary={summary} timeline={openTimeline} />);

    expect(screen.getByText("12/10 · em 5 dias")).toHaveAttribute("data-deadline-ahead", "true");
    expect(screen.getByText("desde 21/09")).not.toHaveAttribute("data-deadline-ahead");
  });

  it("preenche cada trecho com o quanto já passou, fora da árvore de acessibilidade", () => {
    const { container } = render(<EventTimeline summary={summary} timeline={openTimeline} />);

    const fills = Array.from(container.querySelectorAll<HTMLElement>("li[aria-hidden='true'] > span"));

    expect(fills.map((fill) => fill.style.getPropertyValue("--segment-fill"))).toEqual(["0.76", "0", "0"]);
  });

  it("pulsa o marcador da etapa atual só com o evento em andamento", () => {
    const { container, rerender } = render(<EventTimeline summary={summary} timeline={openTimeline} />);

    expect(container.querySelectorAll("[data-pulsing]")).toHaveLength(1);

    rerender(<EventTimeline summary={summary} timeline={{ ...openTimeline, isLive: false }} />);

    expect(container.querySelectorAll("[data-pulsing]")).toHaveLength(0);
  });

  it("omite a linha de apoio que não existe", () => {
    const withoutStart: EventTimelineData = {
      ...openTimeline,
      stages: [{ ...openTimeline.stages[0], detail: null, compactDetail: null }, ...openTimeline.stages.slice(1)],
    };

    render(<EventTimeline summary={summary} timeline={withoutStart} />);

    expect(within(stagesList()).getAllByRole("listitem")[0]).toHaveTextContent(/^Inscrições abertas \(etapa atual\)$/);
  });
});
