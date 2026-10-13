import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandPanel } from "./brand-panel";

describe("BrandPanel", () => {
  it("apresenta o sistema com o título principal da tela", () => {
    render(<BrandPanel />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Coordenação inteligente para o arranjo de ônibus." }),
    ).toBeInTheDocument();
  });

  it("diz em uma frase o que o SUOAC é", () => {
    render(<BrandPanel />);

    expect(
      screen.getByText("Mais que um sistema, uma ferramenta para pensar, coordenar e organizar cada viagem."),
    ).toBeInTheDocument();
  });

  it("identifica a marca pelo nome, deixando o símbolo como decoração", () => {
    const { container } = render(<BrandPanel />);

    expect(screen.getByText("SUOAC")).toBeInTheDocument();
    // Alt vazio: o nome ao lado já anuncia a marca, e repetir faria o leitor de
    // tela dizer "SUOAC SUOAC".
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("mostra a jornada do evento", () => {
    render(<BrandPanel />);

    expect(screen.getByRole("heading", { name: "Sua jornada, simplificada" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });
});
