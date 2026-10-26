import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordStrengthMeter } from "./password-strength-meter";

describe("PasswordStrengthMeter", () => {
  it("nao classifica senha quando o campo esta vazio", () => {
    render(<PasswordStrengthMeter value="" />);

    expect(screen.getByText("Use letras maiúsculas, minúsculas, números e símbolos")).toBeInTheDocument();
    expect(screen.getByText("0 de 5 requisitos cumpridos.")).toBeInTheDocument();
  });

  it.each([
    ["   ", "muito fraca", 0],
    ["abc", "fraca", 1],
    ["abcdefghijkl", "razoável", 2],
    ["Abcdefghijkl", "razoável", 3],
    ["Abcdefghijk1", "quase lá", 4],
    ["Abcdefghij1!", "forte", 5],
  ])("classifica %s como %s pelo total de requisitos", (password, label, count) => {
    render(<PasswordStrengthMeter value={password} />);

    expect(screen.getByRole("status")).toHaveTextContent(label);
    expect(screen.getByText(`${count} de 5 requisitos cumpridos.`)).toBeInTheDocument();
  });

  it("lista os requisitos pendentes, nao so a nota", () => {
    render(<PasswordStrengthMeter value="senhalongaaaa" />);

    const requirements = screen.getByRole("list", { name: "Requisitos da senha" });
    const maiuscula = screen.getByText(/Uma letra maiúscula/);
    const minuscula = screen.getByText(/Uma letra minúscula/);

    expect(within(requirements).getAllByRole("listitem")).toHaveLength(5);
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
    render(<PasswordStrengthMeter value="senhalongaaaa" />);

    expect(screen.getByText("2 de 5 requisitos cumpridos.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("razoável");
  });

  it("não chama de boa a senha que o servidor vai recusar", () => {
    // Dez caracteres com maiúscula, minúscula, número e símbolo: cumpre quatro dos
    // cinco requisitos e reprova no mínimo de 12. "Boa" prometeria aprovação.
    render(<PasswordStrengthMeter value="Senha-123aa" />);

    expect(screen.getByRole("status")).toHaveTextContent("quase lá");
    expect(screen.getByText(/12 ou mais caracteres/)).toHaveTextContent("pendente");
  });

  it("esconde a lista quando so as barras sao pedidas", () => {
    render(<PasswordStrengthMeter value="Senha-Segura123" barsOnly />);

    expect(screen.queryByText(/Uma letra maiúscula/)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("forte");
  });
});
