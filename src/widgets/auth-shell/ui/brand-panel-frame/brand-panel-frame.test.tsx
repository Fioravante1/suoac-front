import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandPanelFrame } from "./brand-panel-frame";

describe("BrandPanelFrame", () => {
  it("monta o conteúdo recebido dentro do painel lateral", () => {
    render(
      <BrandPanelFrame>
        <p>Conteúdo do painel</p>
      </BrandPanelFrame>,
    );

    expect(screen.getByRole("complementary")).toContainElement(screen.getByText("Conteúdo do painel"));
  });

  it("deixa os aneis decorativos fora da árvore de acessibilidade", () => {
    const { container } = render(<BrandPanelFrame>conteúdo</BrandPanelFrame>);

    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });
});
