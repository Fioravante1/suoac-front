import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tooltip } from "./tooltip";

describe("Tooltip", () => {
  it("renderiza children e aplica data-tooltip", () => {
    render(
      <Tooltip content="Mensagem de ajuda">
        <button type="button">Ação</button>
      </Tooltip>,
    );

    expect(screen.getByText("Ação")).toBeInTheDocument();
    expect(screen.getByText("Ação").parentElement).toHaveAttribute("data-tooltip", "Mensagem de ajuda");
  });
});
