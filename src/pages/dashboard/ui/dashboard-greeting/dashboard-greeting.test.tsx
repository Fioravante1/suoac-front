import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal()),
  getGreetingByTime: () => "Bom dia",
}));

import { DashboardGreeting } from "./dashboard-greeting";

describe("DashboardGreeting", () => {
  it("renderiza saudacao com nome do usuario baseada no horario", () => {
    render(<DashboardGreeting userName="Joao" congregationName={null} isCircuitUser={true} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Bom dia, Joao!");
  });

  it("exibe nome da congregacao quando fornecido", () => {
    render(<DashboardGreeting userName="Joao" congregationName="Central" isCircuitUser={false} />);

    expect(screen.getByText("Central")).toBeInTheDocument();
  });

  it("exibe 'Visao geral do circuito' para usuario de circuito sem congregacao", () => {
    render(<DashboardGreeting userName="Joao" congregationName={null} isCircuitUser={true} />);

    expect(screen.getByText("Visao geral do circuito")).toBeInTheDocument();
  });

  it("nao exibe subtitulo para usuario de congregacao sem nome de congregacao", () => {
    render(<DashboardGreeting userName="Joao" congregationName={null} isCircuitUser={false} />);

    expect(screen.queryByText("Visao geral do circuito")).not.toBeInTheDocument();
  });
});
