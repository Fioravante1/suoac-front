import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShellNext } from "./app-shell-next";

const mocks = vi.hoisted(() => ({ pathname: "/dashboard", alternative: false }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/features/select-event", () => ({
  SelectedEventProvider: ({ children }: { children: ReactNode }) => <div data-testid="selection">{children}</div>,
}));
vi.mock("@/shared/theme", () => ({
  LegacyThemeScope: ({ children }: { children: ReactNode }) => <div data-testid="legacy">{children}</div>,
}));
vi.mock("../event-strip", () => ({ EventStrip: () => <div>Faixa desktop</div> }));
vi.mock("../event-summary", () => ({ EventSummary: () => <div>Resumo desktop</div> }));
vi.mock("../panel-top-bar", () => ({ PanelTopBar: () => <div>Topo compacto</div> }));
vi.mock("../stacked-screen-bar", () => ({ StackedScreenBar: () => <div>Voltar para Mais</div> }));
vi.mock("../event-home-hero", () => ({ EventHomeHero: () => <div>Hero compacto</div> }));
vi.mock("../panel-bottom-nav", () => ({ PanelBottomNav: () => <div>Navegação inferior</div> }));
vi.mock("../quick-actions-dock", () => ({ QuickActionsDock: () => <div>Atalhos</div> }));
vi.mock("../panel-event-state", () => ({
  PanelEventState: ({ children, className }: { children: ReactNode; className?: string }) => (
    <section data-testid="panel-state">
      {mocks.alternative ? <p className={className}>Painel alternativo</p> : children}
    </section>
  ),
}));

describe("AppShellNext", () => {
  beforeEach(() => {
    mocks.pathname = "/dashboard";
    mocks.alternative = false;
  });

  it("monta toda a casca dentro do provider da seleção", () => {
    render(
      <AppShellNext>
        <p>Conteúdo v1</p>
      </AppShellNext>,
    );

    const provider = screen.getByTestId("selection");
    for (const label of [
      "Faixa desktop",
      "Resumo desktop",
      "Topo compacto",
      "Voltar para Mais",
      "Hero compacto",
      "Navegação inferior",
      "Atalhos",
    ]) {
      expect(provider).toContainElement(screen.getByText(label));
      expect(screen.getByText(label).closest('[data-testid="legacy"]')).toBeNull();
    }
    expect(provider).toContainElement(screen.getByTestId("panel-state"));
  });

  it.each(["/dashboard", "/financial", "/passengers"])("contém só o conteúdo v1 de %s", (pathname) => {
    mocks.pathname = pathname;
    render(
      <AppShellNext>
        <p>Conteúdo v1</p>
      </AppShellNext>,
    );

    expect(screen.getByTestId("legacy")).toContainElement(screen.getByText("Conteúdo v1"));
    expect(screen.getByTestId("panel-state")).toContainElement(screen.getByTestId("legacy"));
  });

  it("deixa Mais no tema escolhido", () => {
    mocks.pathname = "/more";
    render(
      <AppShellNext>
        <p>Mais</p>
      </AppShellNext>,
    );

    expect(screen.getByText("Mais")).toBeInTheDocument();
    expect(screen.queryByTestId("legacy")).not.toBeInTheDocument();
  });

  it("deixa estados alternativos fora da contenção e substitui o conteúdo v1", () => {
    mocks.alternative = true;
    render(
      <AppShellNext>
        <p>Conteúdo v1</p>
      </AppShellNext>,
    );

    expect(screen.getByText("Painel alternativo")).toBeInTheDocument();
    expect(screen.queryByTestId("legacy")).not.toBeInTheDocument();
    expect(screen.queryByText("Conteúdo v1")).not.toBeInTheDocument();
  });

  it("dá aos estados alternativos o mesmo respiro do conteúdo v1", () => {
    const { unmount } = render(
      <AppShellNext>
        <p>Conteúdo v1</p>
      </AppShellNext>,
    );
    const contentClass = screen.getByText("Conteúdo v1").parentElement?.className ?? "";
    unmount();

    mocks.alternative = true;
    render(
      <AppShellNext>
        <p>Conteúdo v1</p>
      </AppShellNext>,
    );

    expect(contentClass).not.toBe("");
    expect(screen.getByText("Painel alternativo")).toHaveClass(contentClass);
  });
});
