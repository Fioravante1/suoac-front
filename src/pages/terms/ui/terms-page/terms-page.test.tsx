import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { formatTermsDate } from "@/shared/config/terms";

import { TermsPage } from "./terms-page";

describe("página de termos de uso", () => {
  it("anuncia o assunto no título principal", () => {
    render(<TermsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Termos de uso" })).toBeInTheDocument();
  });

  it("exibe como última atualização a data da versão que os formulários enviam", () => {
    render(<TermsPage />);

    expect(screen.getByText(`Última atualização: ${formatTermsDate()}`)).toBeInTheDocument();
  });

  it("diz quem pode usar e que não há cadastro aberto", () => {
    render(<TermsPage />);

    expect(screen.getByRole("heading", { level: 2, name: /quem pode usar/i })).toBeInTheDocument();
    expect(screen.getByText(/não há cadastro aberto/i)).toBeInTheDocument();
  });

  it("declara que a conta é pessoal e intransferível", () => {
    render(<TermsPage />);

    expect(screen.getByText(/pessoal e intransferível/i)).toBeInTheDocument();
  });

  it("não deixa pendência de redação no texto publicado", () => {
    // Os pontos em aberto do rascunho viraram decisão; um colchete restante
    // significaria texto de revisão exposto ao usuário.
    const { container } = render(<TermsPage />);

    expect(container.textContent).not.toMatch(/\[|\]/);
  });

  it("remete à página de privacidade como parte dos termos", () => {
    // O aceite da etapa 2 cobre termos e privacidade juntos; o link fecha o ciclo.
    render(<TermsPage />);

    expect(screen.getByRole("link", { name: "Privacidade" })).toHaveAttribute("href", "/privacidade");
  });

  it("indica o e-mail do SUOAC como canal de contato", () => {
    render(<TermsPage />);

    const links = screen.getAllByRole("link", { name: "suoac@gmail.com" });

    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link).toHaveAttribute("href", "mailto:suoac@gmail.com"));
  });
});
