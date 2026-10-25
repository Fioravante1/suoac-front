import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpPage } from "./help-page";

describe("página de ajuda", () => {
  it("anuncia o assunto no título principal", () => {
    render(<HelpPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Ajuda" })).toBeInTheDocument();
  });

  it("não exibe aviso de texto provisório", () => {
    render(<HelpPage />);

    expect(screen.queryByText(/provisório/i)).not.toBeInTheDocument();
  });

  it("explica que o acesso vem por convite, não por cadastro aberto", () => {
    // É a dúvida que leva alguém a abrir esta página a partir da tela de entrada.
    render(<HelpPage />);

    expect(screen.getByRole("heading", { level: 2, name: /como se consegue acesso/i })).toBeInTheDocument();
    expect(screen.getByText(/não há cadastro aberto/i)).toBeInTheDocument();
  });

  it("aponta o link de recuperação de senha da tela de entrada", () => {
    // A recuperação existe (SUC-25/26); a ajuda precisa mandar o usuário para ela
    // em vez de pedir que alguém reenvie o acesso.
    render(<HelpPage />);

    expect(screen.getByText(/esqueci a senha/i)).toBeInTheDocument();
    expect(screen.queryByText(/ainda está sendo construída/i)).not.toBeInTheDocument();
  });

  it("oferece o e-mail do SUOAC como último recurso", () => {
    render(<HelpPage />);

    expect(screen.getByRole("link", { name: "suoac@gmail.com" })).toHaveAttribute("href", "mailto:suoac@gmail.com");
  });
});
