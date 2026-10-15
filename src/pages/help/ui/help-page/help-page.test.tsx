import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpPage } from "./help-page";

describe("página de ajuda", () => {
  it("anuncia o assunto no título principal", () => {
    render(<HelpPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Ajuda" })).toBeInTheDocument();
  });

  it("avisa que o texto é provisório", () => {
    render(<HelpPage />);

    expect(screen.getByText(/este texto é provisório/i)).toBeInTheDocument();
  });

  it("explica que o acesso vem por convite, não por cadastro aberto", () => {
    // É a dúvida que leva alguém a abrir esta página a partir da tela de entrada.
    render(<HelpPage />);

    expect(screen.getByRole("heading", { level: 2, name: /como se consegue acesso/i })).toBeInTheDocument();
    expect(screen.getByText(/não há cadastro aberto/i)).toBeInTheDocument();
  });

  it("não promete recuperação de senha, que ainda não existe", () => {
    // A tela de entrada mostra o controle desabilitado; a ajuda precisa contar a
    // mesma história, e não mandar o usuário procurar um botão que não funciona.
    render(<HelpPage />);

    expect(screen.getByText(/ainda está sendo construída/i)).toBeInTheDocument();
  });
});
