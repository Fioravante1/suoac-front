import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { applyTheme, resetThemeEnvironment, stubSystemColorScheme } from "@/shared/theme-testing";

import { useIsDarkTheme } from "./use-is-dark-theme";

function Probe() {
  return <span data-testid="probe">{useIsDarkTheme() ? "escuro" : "claro"}</span>;
}

beforeEach(resetThemeEnvironment);
afterEach(() => vi.unstubAllGlobals());

describe("useIsDarkTheme", () => {
  it("é claro para quem nunca escolheu um tema, mesmo com o sistema em escuro", () => {
    stubSystemColorScheme({ dark: true });

    render(<Probe />);

    expect(screen.getByTestId("probe")).toHaveTextContent("claro");
  });

  it("acompanha o tema escolhido", () => {
    applyTheme("dark");

    render(<Probe />);

    expect(screen.getByTestId("probe")).toHaveTextContent("escuro");
  });

  it("resolve `system` pelo sistema operacional", () => {
    applyTheme("system");
    stubSystemColorScheme({ dark: true });

    render(<Probe />);

    expect(screen.getByTestId("probe")).toHaveTextContent("escuro");
  });

  it("muda quando o tema do documento muda, sem recarregar", async () => {
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("claro");

    await act(async () => applyTheme("dark"));

    expect(screen.getByTestId("probe")).toHaveTextContent("escuro");
  });
});
