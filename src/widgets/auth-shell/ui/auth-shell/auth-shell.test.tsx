import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { renderWithTheme, resetThemeEnvironment } from "@/shared/theme-testing";

import { AuthShell } from "./auth-shell";

beforeEach(resetThemeEnvironment);

describe("AuthShell", () => {
  it("monta a tela ativa junto dos dois paineis", () => {
    renderWithTheme(
      <AuthShell>
        <h2>Criar nova senha</h2>
      </AuthShell>,
    );

    expect(screen.getByRole("heading", { name: "Criar nova senha" })).toBeInTheDocument();
    // Os dois paineis chegam da propria moldura: nenhuma pagina monta o layout
    // dividido por conta, que era o ponto de promove-la para widgets.
    expect(screen.getByRole("button", { name: "Alternar tema" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("mostra a apresentação da marca quando a tela não traz painel próprio", () => {
    renderWithTheme(
      <AuthShell>
        <h2>Entrar</h2>
      </AuthShell>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Coordenação inteligente para o arranjo de ônibus." }),
    ).toBeInTheDocument();
  });

  it("troca a apresentação da marca pelo painel que a tela traz", () => {
    renderWithTheme(
      <AuthShell aside={<aside>Cartão do convite</aside>}>
        <h2>Seus dados</h2>
      </AuthShell>,
    );

    expect(screen.getByText("Cartão do convite")).toBeInTheDocument();
    expect(screen.queryByText("Coordenação inteligente para o arranjo de ônibus.")).not.toBeInTheDocument();
  });
});
