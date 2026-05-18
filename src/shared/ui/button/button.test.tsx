import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("deve renderizar os children corretamente", () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByRole("button", { name: "Clique aqui" })).toBeInTheDocument();
  });

  it("deve repassar props nativas para o elemento button", () => {
    render(
      <Button disabled type="submit" data-testid="test-btn">
        Enviar
      </Button>
    );
    const button = screen.getByTestId("test-btn");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("type", "submit");
  });
});
