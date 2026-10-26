import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SignupSummary } from "../../model";
import { SignupStepSuccess } from "./signup-step-success";

const SAMPLE_SUMMARY: SignupSummary = {
  circuitName: "SP-17",
  rows: [
    { label: "Coordenador", value: "João Silva" },
    { label: "Circuito", value: "SP-17 · Campinas/SP" },
    { label: "Sua congregação", value: "Central · 10540" },
    { label: "Congregações", value: "3 cadastradas" },
    { label: "Próximo passo", value: "Criar o primeiro evento" },
  ],
};

describe("SignupStepSuccess", () => {
  it("deve exibir o título com o identificador do circuito e todo o resumo cadastrado", () => {
    render(<SignupStepSuccess summary={SAMPLE_SUMMARY} onEnterDashboard={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Circuito SP-17 criado" })).toBeInTheDocument();
    expect(
      screen.getByText("Tudo pronto. Agora você pode criar o primeiro evento e convidar as congregações."),
    ).toBeInTheDocument();

    expect(screen.getByText("Coordenador")).toBeInTheDocument();
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Circuito")).toBeInTheDocument();
    expect(screen.getByText("SP-17 · Campinas/SP")).toBeInTheDocument();
    expect(screen.getByText("Sua congregação")).toBeInTheDocument();
    expect(screen.getByText("Central · 10540")).toBeInTheDocument();
    expect(screen.getByText("Congregações")).toBeInTheDocument();
    expect(screen.getByText("3 cadastradas")).toBeInTheDocument();
    expect(screen.getByText("Próximo passo")).toBeInTheDocument();
    expect(screen.getByText("Criar o primeiro evento")).toBeInTheDocument();
  });

  it("deve acionar onEnterDashboard ao clicar em 'Ir para o painel'", () => {
    const onEnterDashboard = vi.fn();

    render(<SignupStepSuccess summary={SAMPLE_SUMMARY} onEnterDashboard={onEnterDashboard} />);

    fireEvent.click(screen.getByRole("button", { name: "Ir para o painel" }));

    expect(onEnterDashboard).toHaveBeenCalledTimes(1);
  });

  it("deve desabilitar o botão enquanto a entrada no painel está em andamento", () => {
    render(<SignupStepSuccess summary={SAMPLE_SUMMARY} isEnteringDashboard onEnterDashboard={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Ir para o painel/i })).toBeDisabled();
  });
});
