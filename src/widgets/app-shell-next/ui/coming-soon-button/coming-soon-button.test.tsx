import { fireEvent, render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { describe, expect, it } from "vitest";

import { ComingSoonButton } from "./coming-soon-button";

describe("ComingSoonButton", () => {
  it("mostra o botão pelo nome, desabilitado, e explica que chega em breve", () => {
    render(<ComingSoonButton icon={Search} label="Buscar" />);

    const button = screen.getByRole("button", { name: "Buscar" });

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription("Em breve");
  });

  it("continua alcançável pelo Tab, para a dica ser descoberta pelo teclado", () => {
    render(<ComingSoonButton icon={Search} label="Buscar" />);

    const button = screen.getByRole("button", { name: "Buscar" });

    expect(button).not.toBeDisabled();
    button.focus();
    expect(button).toHaveFocus();
  });

  it("não envia formulário nenhum ao ser clicado", () => {
    let submitted = false;
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = true;
        }}
      >
        <ComingSoonButton icon={Search} label="Buscar" />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(submitted).toBe(false);
  });
});
