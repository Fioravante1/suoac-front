import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordStrengthMeter } from "./password-strength-meter";

describe("PasswordStrengthMeter", () => {
  it("nao classifica senha quando o campo esta vazio", () => {
    render(<PasswordStrengthMeter value="" />);

    expect(screen.getByText("Use letras maiúsculas, minúsculas e números")).toBeInTheDocument();
    expect(screen.getByText("0 de 4 requisitos cumpridos.")).toBeInTheDocument();
  });

  it("classifica a senha pelo numero de requisitos cumpridos", () => {
    const { rerender } = render(<PasswordStrengthMeter value="abc" />);
    expect(screen.getByText("fraca")).toBeInTheDocument();

    rerender(<PasswordStrengthMeter value="Abcdefg1" />);
    expect(screen.getByText("forte")).toBeInTheDocument();
  });

  it("lista os requisitos pendentes, nao so a nota", () => {
    render(<PasswordStrengthMeter value="senhalonga" />);

    const requirements = screen.getByRole("list", { name: "Requisitos da senha" });
    const maiuscula = screen.getByText(/Uma letra maiúscula/);
    const minuscula = screen.getByText(/Uma letra minúscula/);

    expect(within(requirements).getAllByRole("listitem")).toHaveLength(4);
    expect(maiuscula).toHaveTextContent("pendente");
    expect(minuscula).toHaveTextContent("cumprido");
  });

  it("apresenta requisitos vazios como pendentes, sem comunicar erro antes da digitacao", () => {
    render(<PasswordStrengthMeter value="" />);

    const requirements = screen.getByRole("list", { name: "Requisitos da senha" });

    for (const item of within(requirements).getAllByRole("listitem")) {
      expect(item).toHaveTextContent("pendente");
    }

    expect(requirements.querySelectorAll("svg")).toHaveLength(0);
  });

  it("anuncia o progresso a leitor de tela sem depender de cor", () => {
    render(<PasswordStrengthMeter value="senhalonga" />);

    expect(screen.getByText("2 de 4 requisitos cumpridos.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("razoável");
  });

  it("não chama de boa a senha que o servidor vai recusar", () => {
    // Seis caracteres com maiúscula, minúscula e número: cumpre três dos quatro
    // requisitos e reprova no mínimo de 8. "Boa" prometeria aprovação.
    render(<PasswordStrengthMeter value="Senha1" />);

    expect(screen.getByRole("status")).toHaveTextContent("quase lá");
    expect(screen.getByText(/Pelo menos 8 caracteres/)).toHaveTextContent("pendente");
  });

  it("esconde a lista quando so as barras sao pedidas", () => {
    render(<PasswordStrengthMeter value="Senha123" barsOnly />);

    expect(screen.queryByText(/Uma letra maiúscula/)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("forte");
  });
});
