import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JourneyTimeline } from "./journey-timeline";

describe("JourneyTimeline", () => {
  it("conta a jornada do evento na ordem em que ela acontece", () => {
    render(<JourneyTimeline />);

    const steps = screen.getAllByRole("listitem");

    expect(steps).toHaveLength(4);
    expect(within(steps[0]).getByText("Evento criado")).toBeInTheDocument();
    expect(within(steps[1]).getByText("Inscrições abertas")).toBeInTheDocument();
    expect(within(steps[2]).getByText("Passageiros registrados")).toBeInTheDocument();
    expect(within(steps[3]).getByText("Viagem realizada")).toBeInTheDocument();
  });

  it("explica cada etapa com uma linha de apoio", () => {
    render(<JourneyTimeline />);

    expect(screen.getByText("Datas, local e valor definidos")).toBeInTheDocument();
    expect(screen.getByText("Congregações montam suas listas")).toBeInTheDocument();
    expect(screen.getByText("Poltronas e pagamentos organizados")).toBeInTheDocument();
    expect(screen.getByText("Embarque e rastreamento no dia")).toBeInTheDocument();
  });

  it("nomeia a seção para quem navega por cabeçalhos", () => {
    render(<JourneyTimeline />);

    expect(screen.getByRole("heading", { name: "Sua jornada, simplificada" })).toBeInTheDocument();
  });

  it("esconde os ícones de tecnologias assistivas, porque o texto ao lado já diz a etapa", () => {
    const { container } = render(<JourneyTimeline />);

    for (const icon of container.querySelectorAll("svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("aceita uma classe de fora, para o painel posicionar e animar a entrada", () => {
    const { container } = render(<JourneyTimeline className="entrada" />);

    expect(container.querySelector("section")).toHaveClass("entrada");
  });
});
