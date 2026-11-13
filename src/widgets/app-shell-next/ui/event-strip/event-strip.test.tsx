import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_ROLES, type SessionUser } from "@/shared/auth";

const mocks = vi.hoisted(() => ({ useAuth: vi.fn(), useQuery: vi.fn() }));

vi.mock("@/shared/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/auth")>()),
  useAuth: mocks.useAuth,
}));
vi.mock("@/shared/api", () => ({ useQuery: mocks.useQuery }));
vi.mock("@/entities/circuit", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/circuit")>();

  return { ...original, ownCircuitOptions: (circuitId: string) => ({ queryKey: ["circuit", circuitId] }) };
});
vi.mock("@/features/select-event", () => ({
  EventSwitcherMenu: () => <button type="button">Seletor de evento</button>,
}));
vi.mock("@/shared/ui/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Alternar tema</button>,
}));
vi.mock("../account-menu", () => ({
  AccountMenu: () => <button type="button">Conta</button>,
}));

import { EventStrip } from "./event-strip";

const coordinator: SessionUser = {
  id: "user-1",
  name: "Marcos Oliveira",
  email: "marcos.oliveira@gmail.com",
  role: USER_ROLES.CIRCUIT_COORDINATOR,
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

describe("EventStrip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({ user: coordinator, isAuthenticated: true });
  });

  it("mostra a marca com o circuito da sessão", () => {
    mocks.useQuery.mockReturnValue({ data: { id: "circuit-1", name: "SP-17", city: "Campinas", state: "SP" } });

    render(<EventStrip />);

    expect(mocks.useQuery).toHaveBeenCalledWith({ queryKey: ["circuit", "circuit-1"] });
    expect(screen.getByText("SUOAC")).toBeInTheDocument();
    expect(screen.getByText("Circuito SP-17")).toBeInTheDocument();
  });

  it("mostra só a marca enquanto o circuito não chega", () => {
    mocks.useQuery.mockReturnValue({ data: undefined });

    render(<EventStrip />);

    expect(screen.getByText("SUOAC")).toBeInTheDocument();
    expect(screen.queryByText(/^Circuito /)).not.toBeInTheDocument();
  });

  it("monta, na ordem do desenho, seletor, busca, notificações, tema e conta", () => {
    mocks.useQuery.mockReturnValue({ data: undefined });

    render(<EventStrip />);

    const names = screen
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label") ?? button.textContent);

    expect(names).toEqual(["Seletor de evento", "Buscar", "Notificações", "Alternar tema", "Conta"]);
  });

  it("deixa busca e notificações desabilitadas até a Fatia 9", () => {
    mocks.useQuery.mockReturnValue({ data: undefined });

    render(<EventStrip />);

    expect(screen.getByRole("button", { name: "Buscar" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Notificações" })).toHaveAttribute("aria-disabled", "true");
  });

  it("não traz Encerrar inscrições nem Cadastrar passageiro, que moram no resumo do evento", () => {
    mocks.useQuery.mockReturnValue({ data: undefined });

    render(<EventStrip />);

    expect(screen.queryByRole("button", { name: /Encerrar inscrições/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cadastrar passageiro/ })).not.toBeInTheDocument();
  });
});
