import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TextFieldNext } from "./text-field-next";

describe("TextFieldNext", () => {
  it("liga o rótulo ao campo, para que clicar nele foque o campo", () => {
    render(<TextFieldNext label="E-mail" />);

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("anuncia o erro e marca o campo como inválido", () => {
    render(<TextFieldNext label="E-mail" error="Informe um e-mail válido." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Informe um e-mail válido.");
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
  });

  it("descreve o campo pela mensagem, para o leitor de tela ouvir as duas coisas juntas", () => {
    render(<TextFieldNext label="E-mail" error="Informe um e-mail válido." />);

    const input = screen.getByLabelText("E-mail");

    expect(input.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
  });

  it("mostra aviso que não é erro sem marcar o campo como inválido", () => {
    render(<TextFieldNext label="Senha" hint="Caps Lock está ativado" />);

    expect(screen.getByText("Caps Lock está ativado")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).not.toHaveAttribute("aria-invalid");
  });

  it("prefere mostrar o erro quando há aviso e erro ao mesmo tempo", () => {
    render(<TextFieldNext label="Senha" hint="Caps Lock está ativado" error="Senha muito curta." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Senha muito curta.");
    expect(screen.queryByText("Caps Lock está ativado")).not.toBeInTheDocument();
  });

  it("acomoda ação no rótulo e controle dentro do campo", () => {
    render(
      <TextFieldNext
        label="Senha"
        labelAction={<button type="button">Esqueci a senha</button>}
        trailing={<button type="button">Mostrar senha</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Esqueci a senha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toBeInTheDocument();
  });

  it("esconde o ícone decorativo de tecnologias assistivas", () => {
    const { container } = render(<TextFieldNext label="E-mail" icon={<svg />} />);

    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });
});
