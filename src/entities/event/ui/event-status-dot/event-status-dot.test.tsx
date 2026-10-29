import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EVENT_STATUS_BADGE_VARIANTS, EVENT_STATUSES } from "../../model";

import { EventStatusDot } from "./event-status-dot";

describe("EventStatusDot", () => {
  it("leva a variante do status do evento", () => {
    const { container } = render(<EventStatusDot variant={EVENT_STATUS_BADGE_VARIANTS[EVENT_STATUSES.CANCELLED]} />);

    expect(container.firstChild).toHaveAttribute("data-variant", "critical");
  });

  it("é decorativo e fica fora da árvore de acessibilidade", () => {
    const { container } = render(<EventStatusDot variant="success" />);

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("diz sobre que fundo aparece, para o neutro ficar visível sobre o navy", () => {
    const { container: onNavy } = render(<EventStatusDot variant="neutral" surface="navy" />);
    const { container: onSurface } = render(<EventStatusDot variant="neutral" />);

    expect(onNavy.firstChild).toHaveAttribute("data-surface", "navy");
    expect(onSurface.firstChild).toHaveAttribute("data-surface", "default");
  });

  it("aceita uma classe de quem usa", () => {
    const { container } = render(<EventStatusDot variant="neutral" className="extra" />);

    expect(container.firstChild).toHaveClass("extra");
  });
});
