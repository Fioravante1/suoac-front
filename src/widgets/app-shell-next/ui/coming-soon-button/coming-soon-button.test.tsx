import { act, fireEvent, render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ComingSoonButton } from "./coming-soon-button";

describe("ComingSoonButton", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra a dica por um instante quando tocado, porque o toque não tem hover", () => {
    vi.useFakeTimers();
    render(<ComingSoonButton label="Encerrar inscrições" />);

    const button = screen.getByRole("button", { name: "Encerrar inscrições" });
    const root = button.parentElement;

    expect(root).not.toHaveAttribute("data-hint-shown");

    fireEvent.click(button);
    expect(root).toHaveAttribute("data-hint-shown", "true");

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(root).not.toHaveAttribute("data-hint-shown");
  });

  it("recomeça a contagem a cada toque", () => {
    vi.useFakeTimers();
    render(<ComingSoonButton label="Encerrar inscrições" />);

    const button = screen.getByRole("button", { name: "Encerrar inscrições" });

    fireEvent.click(button);
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    fireEvent.click(button);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(button.parentElement).toHaveAttribute("data-hint-shown", "true");
  });

  it("esconde a dica quando o foco sai do botão", () => {
    render(<ComingSoonButton label="Encerrar inscrições" />);

    const button = screen.getByRole("button", { name: "Encerrar inscrições" });

    fireEvent.click(button);
    fireEvent.blur(button);

    expect(button.parentElement).not.toHaveAttribute("data-hint-shown");
  });

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

  it("sem ícone, escreve o nome no botão, desabilitado e com a mesma dica", () => {
    render(<ComingSoonButton label="Encerrar inscrições" />);

    const button = screen.getByRole("button", { name: "Encerrar inscrições" });

    expect(button).toHaveTextContent("Encerrar inscrições");
    expect(button).not.toHaveAttribute("aria-label");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription("Em breve");
  });
});
