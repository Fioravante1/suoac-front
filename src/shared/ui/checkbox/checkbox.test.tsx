import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("é uma caixa de seleção de verdade, alcançável pelo rótulo", () => {
    render(<Checkbox label="Manter conectado" />);

    expect(screen.getByRole("checkbox", { name: "Manter conectado" })).toBeInTheDocument();
  });

  it("marca e desmarca ao clicar", () => {
    render(<Checkbox label="Manter conectado" defaultChecked={false} />);

    const checkbox = screen.getByRole("checkbox");

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("respeita o estado inicial recebido", () => {
    render(<Checkbox label="Manter conectado" defaultChecked />);

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("repassa o estado desabilitado para o campo, e não só para o visual", () => {
    // Quem bloqueia o clique é o navegador, a partir deste atributo. Simular o
    // clique aqui testaria o jsdom, que não o respeita.
    render(<Checkbox label="Manter conectado" disabled />);

    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});
