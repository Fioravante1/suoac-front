import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { EventDetailSkeleton } from "./event-detail-skeleton";

describe("EventDetailSkeleton", () => {
  it("renderiza com role status e aria-label Carregando", () => {
    render(<EventDetailSkeleton />);

    const status = screen.getByRole("status");

    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-label", "Carregando");
  });

  it("renderiza duas seções de info cards lado a lado", () => {
    const { container } = render(<EventDetailSkeleton />);
    const infoCards = container.querySelectorAll("[class*='card']>[class*='infoGrid']");

    expect(infoCards).toHaveLength(2);
  });

  it("renderiza dois day cards skeleton", () => {
    const { container } = render(<EventDetailSkeleton />);
    const dayCards = container.querySelectorAll("[class*='dayCard']");

    expect(dayCards).toHaveLength(2);
  });

  it("renderiza seção de inscrições com skeleton de tabela", () => {
    const { container } = render(<EventDetailSkeleton />);
    const tableRows = container.querySelectorAll("[class*='tableRow']");

    expect(tableRows.length).toBeGreaterThan(0);
  });
});
