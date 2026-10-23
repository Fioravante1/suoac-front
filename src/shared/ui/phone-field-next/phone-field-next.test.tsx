import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PhoneFieldNext } from "./phone-field-next";

function setup(props: Partial<React.ComponentProps<typeof PhoneFieldNext>> = {}) {
  render(<PhoneFieldNext label="Celular (WhatsApp)" {...props} />);

  return screen.getByLabelText("Celular (WhatsApp)") as HTMLInputElement;
}

describe("PhoneFieldNext", () => {
  it("aplica a máscara enquanto se digita", () => {
    const input = setup();

    fireEvent.change(input, { target: { value: "19996543210" } });

    expect(input.value).toBe("(19) 99654-3210");
  });

  it("aceita o número já com máscara", () => {
    const input = setup();

    fireEvent.change(input, { target: { value: "(19) 99654-3210" } });

    expect(input.value).toBe("(19) 99654-3210");
  });

  it("descarta o que passa do teto do celular", () => {
    const input = setup();

    fireEvent.change(input, { target: { value: "199965432109999" } });

    expect(input.value).toBe("(19) 99654-3210");
  });

  it("repassa a mudança ao formulário depois de mascarar, para ele guardar o valor mascarado", () => {
    const onChange = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => event.target.value);
    const input = setup({ onChange });

    fireEvent.change(input, { target: { value: "19996543210" } });

    expect(onChange).toHaveReturnedWith("(19) 99654-3210");
  });

  it("usa o teclado numérico do celular e o preenchimento de telefone", () => {
    const input = setup();

    expect(input).toHaveAttribute("type", "tel");
    expect(input).toHaveAttribute("inputmode", "tel");
    expect(input).toHaveAttribute("autocomplete", "tel");
  });

  it("limita o campo ao tamanho da máscara cheia", () => {
    expect(setup()).toHaveAttribute("maxlength", "15");
  });

  it("mostra o erro de validação embaixo do campo", () => {
    setup({ error: "Informe o DDD e o número completo." });

    expect(screen.getByRole("alert")).toHaveTextContent("Informe o DDD e o número completo.");
  });

  it("ao apagar sobre o hífen, inclui o dígito vizinho na exclusão", () => {
    const input = setup();
    fireEvent.change(input, { target: { value: "19996543210" } });
    // "(19) 99654-3210": cursor logo depois do hífen (posição 11).
    input.setSelectionRange(11, 11);

    fireEvent.keyDown(input, { key: "Backspace" });

    expect(input.selectionStart).toBe(9);
    expect(input.selectionEnd).toBe(11);
  });
});
