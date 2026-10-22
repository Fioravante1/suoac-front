import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordFieldNext } from "./password-field-next";

function getField() {
  return screen.getByLabelText("Senha");
}

describe("PasswordFieldNext", () => {
  it("esconde a senha por padrão", () => {
    render(<PasswordFieldNext label="Senha" />);

    expect(getField()).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toBeInTheDocument();
  });

  it("revela a senha e troca o rótulo do botão", () => {
    render(<PasswordFieldNext label="Senha" />);

    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));

    expect(getField()).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar senha" })).toBeInTheDocument();
  });

  it("volta a esconder a senha no segundo clique", () => {
    render(<PasswordFieldNext label="Senha" />);

    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    fireEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));

    expect(getField()).toHaveAttribute("type", "password");
  });

  it("avisa quando o Caps Lock está ativado", () => {
    render(<PasswordFieldNext label="Senha" />);

    fireEvent.keyDown(getField(), { key: "A", modifierCapsLock: true });

    expect(screen.getByText("Caps Lock está ativado")).toBeInTheDocument();
  });

  it("retira o aviso quando o Caps Lock é desligado", () => {
    render(<PasswordFieldNext label="Senha" />);

    fireEvent.keyDown(getField(), { key: "A", modifierCapsLock: true });
    fireEvent.keyUp(getField(), { key: "CapsLock", modifierCapsLock: false });

    expect(screen.queryByText("Caps Lock está ativado")).not.toBeInTheDocument();
  });

  it("não insiste no aviso de Caps Lock quando há erro a resolver", () => {
    render(<PasswordFieldNext label="Senha" error="Senha muito curta." />);

    fireEvent.keyDown(getField(), { key: "A", modifierCapsLock: true });

    expect(screen.queryByText("Caps Lock está ativado")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Senha muito curta.");
  });

  it("preserva o manipulador de teclado de quem usa o campo", () => {
    let pressed = "";

    render(<PasswordFieldNext label="Senha" onKeyDown={(event) => (pressed = event.key)} />);

    fireEvent.keyDown(getField(), { key: "Enter" });

    expect(pressed).toBe("Enter");
  });

  it("mostra o aviso da tela abaixo do campo", () => {
    render(<PasswordFieldNext label="Nova senha" notice="A senha colada foi cortada." />);

    expect(screen.getByText("A senha colada foi cortada.")).toBeInTheDocument();
  });

  it("deixa o aviso da tela passar na frente do Caps Lock", () => {
    // Um texto por vez embaixo do campo. O aviso da tela fala de algo que ja
    // aconteceu com o que foi digitado; o Caps Lock, de uma tecla ligada.
    render(<PasswordFieldNext label="Nova senha" notice="A senha colada foi cortada." />);

    const campo = screen.getByLabelText("Nova senha");
    fireEvent.keyDown(campo, { key: "A", getModifierState: () => true });

    expect(screen.getByText("A senha colada foi cortada.")).toBeInTheDocument();
    expect(screen.queryByText("Caps Lock está ativado")).not.toBeInTheDocument();
  });

  it("deixa o erro de validação passar na frente do aviso da tela", () => {
    render(<PasswordFieldNext label="Nova senha" notice="A senha colada foi cortada." error="Senha muito curta." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Senha muito curta.");
    expect(screen.queryByText("A senha colada foi cortada.")).not.toBeInTheDocument();
  });
});
