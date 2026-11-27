import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PrivateLayout from "./layout";

const mocks = vi.hoisted(() => ({ flag: vi.fn() }));
vi.mock("@/shared/feature-flags", () => ({ redesignAppShellFlag: mocks.flag }));
vi.mock("@/shared/auth", () => ({ SessionGuard: () => <span>Guarda de sessão</span> }));
vi.mock("@/shared/theme", () => ({
  LegacyThemeScope: ({ children }: { children: ReactNode }) => <div data-testid="legacy">{children}</div>,
}));
vi.mock("@/widgets/app-shell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <main data-testid="old-shell">{children}</main>,
}));
vi.mock("@/widgets/app-shell-next", () => ({
  AppShellNext: ({ children }: { children: ReactNode }) => <main data-testid="new-shell">{children}</main>,
}));

describe("fachada do layout privado", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserva o shell e a contenção existentes com a flag desligada", async () => {
    mocks.flag.mockResolvedValue(false);
    render(await PrivateLayout({ children: <p>Tela privada</p> }));

    const shell = screen.getByTestId("old-shell");
    expect(screen.getByTestId("legacy")).toContainElement(shell);
    expect(shell).toContainElement(screen.getByText("Guarda de sessão"));
    expect(shell).toContainElement(screen.getByText("Tela privada"));
    expect(screen.queryByTestId("new-shell")).not.toBeInTheDocument();
  });

  it("escolhe a fronteira cliente do shell novo com a flag ligada", async () => {
    mocks.flag.mockResolvedValue(true);
    render(await PrivateLayout({ children: <p>Tela privada</p> }));

    const shell = screen.getByTestId("new-shell");
    expect(shell).toContainElement(screen.getByText("Tela privada"));
    expect(screen.queryByTestId("old-shell")).not.toBeInTheDocument();
    expect(screen.queryByTestId("legacy")).not.toBeInTheDocument();
  });

  it("mantém a guarda de sessão fora do shell novo, que troca o conteúdo nos estados do Início", async () => {
    mocks.flag.mockResolvedValue(true);
    render(await PrivateLayout({ children: <p>Tela privada</p> }));

    expect(screen.getByText("Guarda de sessão")).toBeInTheDocument();
    expect(screen.getByTestId("new-shell")).not.toContainElement(screen.getByText("Guarda de sessão"));
  });
});
