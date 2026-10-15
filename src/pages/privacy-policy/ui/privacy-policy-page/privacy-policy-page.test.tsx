import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyPolicyPage } from "./privacy-policy-page";

describe("página de privacidade", () => {
  it("anuncia o assunto no título principal", () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Privacidade" })).toBeInTheDocument();
  });

  it("avisa que o texto é provisório", () => {
    // Enquanto a coordenação não escrever a versão final, a página não pode
    // passar por política definitiva — seria compromisso que ninguém assumiu.
    render(<PrivacyPolicyPage />);

    expect(screen.getByText(/este texto é provisório/i)).toBeInTheDocument();
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

  it("lista as perguntas que a versão final precisa responder", () => {
    // Serve de pauta para quem for redigir: retenção, compartilhamento e remoção.
    render(<PrivacyPolicyPage />);

    expect(screen.getByText(/por quanto tempo os dados de um evento são mantidos/i)).toBeInTheDocument();
  });
});
