import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { PasswordField } from "./password-field";

describe("PasswordField", () => {
  it("inicia com a senha oculta", () => {
    render(<PasswordField label="Senha" />);
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toBeInTheDocument();
  });

  it("alterna a visibilidade da senha ao clicar no botão", () => {
    render(<PasswordField label="Senha" />);

    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));

    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar senha" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));

    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
  });

  it("propaga o valor digitado e a mensagem de erro", () => {
    render(<PasswordField label="Senha" error="Campo obrigatório" />);

    const input = screen.getByLabelText("Senha");
    fireEvent.change(input, { target: { value: "secreta" } });

    expect(input).toHaveValue("secreta");
    expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
  });
});
