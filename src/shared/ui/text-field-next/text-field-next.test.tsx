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

  it("marca a borda pelo veredito, sem acrescentar mensagem abaixo do campo", () => {
    // O texto que explica o veredito fica ao lado do rótulo — ver a confirmação
    // de senha da tela de redefinição.
    const { rerender } = render(<TextFieldNext label="Confirme a senha" status="valid" />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Confirme a senha")).not.toHaveAttribute("aria-invalid");

    rerender(<TextFieldNext label="Confirme a senha" status="invalid" />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("descreve o campo pelo texto do rótulo quando o veredito não tem mensagem abaixo", () => {
    /*
     * Com `status` e sem mensagem, quem explica o veredito e o texto ao lado do
     * rotulo. Sem a ligacao, quem volta ao campo depois de a regiao viva ja ter
     * falado ouviria "invalido" e mais nada.
     */
    render(
      <TextFieldNext label="Confirme a senha" status="invalid" labelAction={<span>As senhas não coincidem</span>} />,
    );

    const input = screen.getByLabelText("Confirme a senha");
    const descricao = document.getElementById(input.getAttribute("aria-describedby") ?? "");

    expect(descricao).toHaveTextContent("As senhas não coincidem");
  });

  it("não descreve o campo pela ação do rótulo quando não há veredito", () => {
    // "Esqueci a senha" e um atalho, nao uma descricao do campo.
    render(<TextFieldNext label="Senha" labelAction={<button type="button">Esqueci a senha</button>} />);

    expect(screen.getByLabelText("Senha")).not.toHaveAttribute("aria-describedby");
  });

  it("deixa o erro com mensagem prevalecer sobre o veredito de acerto", () => {
    render(<TextFieldNext label="Confirme a senha" status="valid" error="As senhas não coincidem." />);

    expect(screen.getByRole("alert")).toHaveTextContent("As senhas não coincidem.");
    expect(screen.getByLabelText("Confirme a senha")).toHaveAttribute("aria-invalid", "true");
  });

  it("esconde o ícone decorativo de tecnologias assistivas", () => {
    const { container } = render(<TextFieldNext label="E-mail" icon={<svg />} />);

    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });
});
