import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "./card";

describe("Card", () => {
  it("deve renderizar os children corretamente", () => {
    render(
      <Card>
        <p>Conteúdo do card</p>
      </Card>
    );
    expect(screen.getByText("Conteúdo do card")).toBeInTheDocument();
  });

  it("deve repassar className adicional", () => {
    const { container } = render(
      <Card className="minha-classe-customizada">
        <p>Conteúdo</p>
      </Card>
    );
    
    // O container.firstChild deve ser a div do Card
    expect(container.firstChild).toHaveClass("minha-classe-customizada");
  });
});
