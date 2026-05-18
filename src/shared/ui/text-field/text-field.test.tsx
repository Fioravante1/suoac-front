import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TextField } from "./text-field";

describe("TextField", () => {
  it("deve renderizar o input corretamente", () => {
    render(<TextField placeholder="Digite seu nome" />);
    expect(screen.getByPlaceholderText("Digite seu nome")).toBeInTheDocument();
  });

  it("deve renderizar a label ligada ao input", () => {
    render(<TextField label="Email" id="email-input" />);
    // O click na label deve focar o input graças ao atributo htmlFor
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "email-input");
  });

  it("deve exibir a mensagem de erro", () => {
    render(<TextField error="Campo obrigatório" />);
    expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
  });

  it("deve renderizar os ícones", () => {
    render(
      <TextField
        startIcon={<span data-testid="start-icon">Icone Inicio</span>}
        endIcon={<span data-testid="end-icon">Icone Fim</span>}
      />
    );
    expect(screen.getByTestId("start-icon")).toBeInTheDocument();
    expect(screen.getByTestId("end-icon")).toBeInTheDocument();
  });

  it("deve gerar um ID automaticamente se não for fornecido", () => {
    render(<TextField label="Nome" />);
    const input = screen.getByLabelText("Nome");
    expect(input.id).toBeDefined();
    expect(input.id).not.toBe("");
  });
});
