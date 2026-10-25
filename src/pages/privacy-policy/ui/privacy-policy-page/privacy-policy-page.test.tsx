import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyPolicyPage } from "./privacy-policy-page";

describe("página de privacidade", () => {
  it("anuncia o assunto no título principal", () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Privacidade" })).toBeInTheDocument();
  });

  it("não exibe aviso de texto provisório", () => {
    render(<PrivacyPolicyPage />);

    expect(screen.queryByText(/provisório/i)).not.toBeInTheDocument();
  });

  it("diz que dados o sistema guarda e quem os vê", () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByRole("heading", { level: 2, name: /que dados o sistema guarda/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /quem consegue ver/i })).toBeInTheDocument();
  });

  it("declara os dois cookies e a ausência de rastreamento", () => {
    // São fatos verificáveis no código: o cookie de sessão e o de tema, e nenhuma
    // ferramenta de analytics. Se isso mudar, a página passa a mentir.
    render(<PrivacyPolicyPage />);

    expect(screen.getByText(/mantém você conectado/i)).toBeInTheDocument();
    expect(screen.getByText(/tema claro ou escuro/i)).toBeInTheDocument();
    expect(screen.getByText(/não há cookies de publicidade/i)).toBeInTheDocument();
  });

  it("declara a retenção dos dados do evento e do cadastro dos irmãos", () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByRole("heading", { level: 2, name: /por quanto tempo os dados ficam/i })).toBeInTheDocument();
    expect(screen.getByText(/mantidos por 2 anos/i)).toBeInTheDocument();
    expect(screen.getByText(/cadastro dos irmãos permanece na base/i)).toBeInTheDocument();
  });

  it("declara que os dados não saem do circuito", () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByText(/não são compartilhados fora do circuito/i)).toBeInTheDocument();
  });

  it("explica como corrigir e remover dados", () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByRole("heading", { level: 2, name: /correção e remoção/i })).toBeInTheDocument();
    expect(screen.getByText(/pode corrigir os próprios dados/i)).toBeInTheDocument();
    expect(screen.getByText(/também pode excluir outros usuários/i)).toBeInTheDocument();
    expect(screen.getByText(/quem viaja não usa o sistema/i)).toBeInTheDocument();
  });

  it("indica o e-mail do SUOAC como canal de contato", () => {
    render(<PrivacyPolicyPage />);

    const links = screen.getAllByRole("link", { name: "suoac@gmail.com" });

    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link).toHaveAttribute("href", "mailto:suoac@gmail.com"));
  });
});
