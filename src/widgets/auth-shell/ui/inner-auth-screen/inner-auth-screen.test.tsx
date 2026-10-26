import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InnerAuthScreen } from "./inner-auth-screen";

describe("InnerAuthScreen", () => {
  it("monta a tela que recebe", () => {
    render(
      <InnerAuthScreen>
        <h2>Recuperar senha</h2>
      </InnerAuthScreen>,
    );

    expect(screen.getByRole("heading", { name: "Recuperar senha" })).toBeInTheDocument();
  });

  it("marca a tela como interna para o shell esconder a apresentação da marca", () => {
    render(
      <InnerAuthScreen>
        <h2>Recuperar senha</h2>
      </InnerAuthScreen>,
    );

    const marked = screen.getByRole("heading", { name: "Recuperar senha" }).closest("[data-auth-screen]");

    expect(marked).toHaveAttribute("data-auth-screen", "inner");
  });
});
