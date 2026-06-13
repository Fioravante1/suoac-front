import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SessionExpiredOverlay } from "./session-expired-overlay";

describe("SessionExpiredOverlay", () => {
  it("exibe a mensagem de sessão expirada e o redirecionamento", () => {
    render(<SessionExpiredOverlay />);

    expect(screen.getByText("Sua sessão expirou")).toBeInTheDocument();
    expect(screen.getByText("Redirecionando para o login…")).toBeInTheDocument();
  });

  it("anuncia o estado para leitores de tela", () => {
    render(<SessionExpiredOverlay />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();
  });
});
