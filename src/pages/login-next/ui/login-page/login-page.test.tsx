import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithTheme, resetThemeEnvironment } from "@/shared/theme-testing";

import { LoginPage } from "./login-page";

beforeEach(resetThemeEnvironment);
afterEach(() => vi.unstubAllGlobals());

describe("LoginPage", () => {
  it("apresenta o sistema de um lado e o acesso do outro", () => {
    renderWithTheme(<LoginPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Coordenação inteligente para o arranjo de ônibus." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alternar tema" })).toBeInTheDocument();
  });

  it("traz a jornada do evento e o rodapé institucional", () => {
    renderWithTheme(<LoginPage />);

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Privacidade" })).toBeInTheDocument();
  });
});
