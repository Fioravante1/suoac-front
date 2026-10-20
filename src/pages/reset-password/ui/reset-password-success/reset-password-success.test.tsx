import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResetPasswordSuccess } from "./reset-password-success";

describe("ResetPasswordSuccess", () => {
  it("confirma a troca e explica o efeito sobre as outras sessões", () => {
    render(<ResetPasswordSuccess />);

    expect(screen.getByRole("heading", { name: "Senha alterada" })).toBeInTheDocument();
    expect(screen.getByText(/as outras sessões foram encerradas/)).toBeInTheDocument();
  });

  it("resume o que aconteceu com os outros dispositivos", () => {
    render(<ResetPasswordSuccess />);

    expect(screen.getByRole("term")).toHaveTextContent("Outros dispositivos");
    expect(screen.getByRole("definition")).toHaveTextContent("Desconectados");
  });

  it("leva para a entrada, único caminho possível sem sessão", () => {
    // A API devolve `204` sem tokens: nao ha sessao para entrar no painel.
    render(<ResetPasswordSuccess />);

    expect(screen.getByRole("link", { name: "Ir para a entrada" })).toHaveAttribute("href", "/login");
  });
});
