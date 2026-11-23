import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StageMarker } from "./stage-marker";

describe("StageMarker", () => {
  it("fica fora da árvore de acessibilidade, porque a etapa vem escrita ao lado", () => {
    const { container } = render(<StageMarker state="current" isPulsing />);

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("marca o estado da etapa e pulsa só quando pedido", () => {
    const { container, rerender } = render(<StageMarker state="current" isPulsing />);

    expect(container.firstChild).toHaveAttribute("data-state", "current");
    expect(container.firstChild).toHaveAttribute("data-pulsing", "true");

    rerender(<StageMarker state="done" isPulsing={false} />);

    expect(container.firstChild).toHaveAttribute("data-state", "done");
    expect(container.firstChild).not.toHaveAttribute("data-pulsing");
  });

  it("marca a versão compacta do stepper do celular", () => {
    const { container } = render(<StageMarker state="upcoming" isPulsing={false} isCompact />);

    expect(container.firstChild).toHaveAttribute("data-compact", "true");
  });
});
