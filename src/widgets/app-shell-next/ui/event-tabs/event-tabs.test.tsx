import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_ROLES } from "@/shared/auth";

import { EventTabs } from "./event-tabs";

vi.mock("@/shared/auth", async (original) => ({
  ...(await original<typeof import("@/shared/auth")>()),
  useAuthPermissions: () => ({ isCircuitUser: true, userRole: USER_ROLES.CIRCUIT_COORDINATOR }),
}));

const mocks = vi.hoisted(() => ({ usePathname: vi.fn(), useEventTabCounts: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname: mocks.usePathname }));
vi.mock("../../model", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../model")>()),
  useEventTabCounts: mocks.useEventTabCounts,
}));

function tabs() {
  return within(screen.getByRole("navigation", { name: "Seções do evento" })).getAllByRole("link");
}

describe("EventTabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usePathname.mockReturnValue("/dashboard");
    mocks.useEventTabCounts.mockReturnValue({});
  });

  it("leva cada aba à sua rota, na ordem do v3", () => {
    render(<EventTabs eventId="event-1" circuitId="circuit-1" />);

    expect(tabs().map((tab) => [tab.textContent, tab.getAttribute("href")])).toEqual([
      ["Visão geral", "/dashboard"],
      ["Passageiros", "/events/event-1#inscricoes"],
      ["Financeiro", "/financial"],
      ["Congregações", "/congregations"],
      ["Ônibus", "/buses"],
      ["Listas e exportações", "/lists"],
    ]);
  });

  it("marca como página atual só a aba da rota", () => {
    mocks.usePathname.mockReturnValue("/financial");

    render(<EventTabs eventId="event-1" circuitId="circuit-1" />);

    const current = tabs().filter((tab) => tab.getAttribute("aria-current") === "page");

    expect(current.map((tab) => tab.textContent)).toEqual(["Financeiro"]);
  });

  it("continua marcando a aba numa subrota", () => {
    mocks.usePathname.mockReturnValue("/congregations/123");

    render(<EventTabs eventId="event-1" circuitId="circuit-1" />);

    expect(screen.getByRole("link", { name: "Congregações" })).toHaveAttribute("aria-current", "page");
  });

  it("marca Passageiros no detalhe do evento selecionado, onde ficam os inscritos", () => {
    mocks.usePathname.mockReturnValue("/events/event-1");

    render(<EventTabs eventId="event-1" circuitId="circuit-1" />);

    expect(screen.getByRole("link", { name: "Passageiros" })).toHaveAttribute("aria-current", "page");
  });

  it("não marca aba nenhuma fora delas", () => {
    mocks.usePathname.mockReturnValue("/events/outro-evento");

    render(<EventTabs eventId="event-1" circuitId="circuit-1" />);

    expect(tabs().some((tab) => tab.hasAttribute("aria-current"))).toBe(false);
  });

  it("mostra os contadores de Passageiros e Congregações, com separador de milhar", () => {
    mocks.useEventTabCounts.mockReturnValue({ passengers: 1204, congregations: 20 });

    render(<EventTabs eventId="event-1" circuitId="circuit-1" />);

    expect(screen.getByRole("link", { name: "Passageiros 1.204" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Congregações 20" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ônibus" })).toBeInTheDocument();
  });

  it("mostra o contador zerado, que é informação, e não só o que tem inscritos", () => {
    mocks.useEventTabCounts.mockReturnValue({ passengers: 0 });

    render(<EventTabs eventId="event-1" circuitId="circuit-1" />);

    expect(screen.getByRole("link", { name: "Passageiros 0" })).toBeInTheDocument();
  });

  it("conta pelo evento e pelo circuito recebidos", () => {
    render(<EventTabs eventId="event-1" circuitId="circuit-1" />);

    expect(mocks.useEventTabCounts).toHaveBeenCalledWith("event-1", "circuit-1");
  });
});
