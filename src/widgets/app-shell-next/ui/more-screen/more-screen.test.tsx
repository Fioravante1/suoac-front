import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_ROLES, type SessionUser } from "@/shared/auth";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useQuery: vi.fn(),
  useSelectedEvent: vi.fn(),
  useIsDarkTheme: vi.fn(),
  toggleTheme: vi.fn(),
  signOut: vi.fn(),
  isSigningOut: false,
}));

vi.mock("@/shared/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/auth")>()),
  useAuth: mocks.useAuth,
}));
vi.mock("@/shared/api", () => ({ useQuery: mocks.useQuery }));
vi.mock("@/entities/congregation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/congregation")>()),
  congregationEventStatusesOptions: (eventId: string) => ({ queryKey: ["event-statuses", eventId] }),
}));
vi.mock("@/features/select-event", () => ({ useSelectedEvent: mocks.useSelectedEvent }));
vi.mock("@/shared/theme", () => ({
  useTheme: () => ({ toggle: mocks.toggleTheme }),
  useIsDarkTheme: mocks.useIsDarkTheme,
}));
vi.mock("../../model", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../model")>()),
  useSignOut: () => ({ signOut: mocks.signOut, isSigningOut: mocks.isSigningOut }),
}));
vi.mock("../account-circuit", () => ({ AccountCircuit: () => <span>Circuito SP-17</span> }));

import { MoreScreen } from "./more-screen";

const coordinator: SessionUser = {
  id: "user-1",
  name: "Marcos Oliveira",
  email: "marcos.oliveira@gmail.com",
  role: USER_ROLES.CIRCUIT_COORDINATOR,
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

describe("MoreScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSigningOut = false;
    mocks.useAuth.mockReturnValue({ user: coordinator, isAuthenticated: true });
    mocks.useSelectedEvent.mockReturnValue({ event: { id: "event-1" } });
    mocks.useQuery.mockReturnValue({ data: undefined });
    mocks.useIsDarkTheme.mockReturnValue(false);
  });

  it("mostra a conta: nome, e-mail, privilégio por extenso e circuito, sem link para o perfil", () => {
    render(<MoreScreen />);

    const account = screen.getByRole("region", { name: "Dados da conta" });

    expect(within(account).getByText("Marcos Oliveira")).toBeInTheDocument();
    expect(within(account).getByText("marcos.oliveira@gmail.com")).toBeInTheDocument();
    expect(within(account).getByText("Coordenador do arranjo de ônibus no circuito")).toBeInTheDocument();
    expect(within(account).getByText("Circuito SP-17")).toBeInTheDocument();
    expect(within(account).queryByRole("link")).not.toBeInTheDocument();
  });

  it("leva os atalhos do evento às telas empilhadas", () => {
    render(<MoreScreen />);

    const group = screen.getByRole("region", { name: "Evento" });

    expect(within(group).getByRole("link", { name: /Ônibus/ })).toHaveAttribute("href", "/buses");
    expect(within(group).getByRole("link", { name: /Congregações/ })).toHaveAttribute("href", "/congregations");
    expect(within(group).getByRole("link", { name: /Listas e exportações/ })).toHaveAttribute("href", "/lists");
    expect(within(group).getByRole("link", { name: /Listas e exportações/ })).toHaveTextContent(
      "Embarque, pagamentos, WhatsApp",
    );
  });

  it("resume as congregações do evento: quantas no circuito e quantas finalizaram", () => {
    mocks.useQuery.mockReturnValue({
      data: [{ status: "FINALIZED" }, { status: "PENDING" }, { status: "PENDING" }, { status: "FINALIZED" }],
    });

    render(<MoreScreen />);

    expect(screen.getByRole("link", { name: /Congregações/ })).toHaveTextContent("4 no circuito · 2 finalizadas");
  });

  it("escreve a finalizada no singular quando só uma terminou", () => {
    mocks.useQuery.mockReturnValue({ data: [{ status: "FINALIZED" }, { status: "PENDING" }] });

    render(<MoreScreen />);

    expect(screen.getByRole("link", { name: /Congregações/ })).toHaveTextContent("2 no circuito · 1 finalizada");
  });

  it("deixa o apoio das congregações em branco enquanto a situação não chega", () => {
    render(<MoreScreen />);

    expect(screen.getByRole("link", { name: /Congregações/ })).not.toHaveTextContent("no circuito");
  });

  it("alterna o tema pelo interruptor, que mostra o tema que está na tela", () => {
    mocks.useIsDarkTheme.mockReturnValue(true);

    render(<MoreScreen />);
    const toggle = screen.getByRole("switch", { name: "Tema escuro" });

    expect(toggle).toBeChecked();

    fireEvent.click(toggle);

    expect(mocks.toggleTheme).toHaveBeenCalledOnce();
  });

  it("deixa Alterar senha como Em breve, desabilitado, até o SUC-125", () => {
    render(<MoreScreen />);
    const button = screen.getByRole("button", { name: /Alterar senha/ });

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveTextContent("Em breve");
  });

  it("sai da conta pelo Sair", () => {
    render(<MoreScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(mocks.signOut).toHaveBeenCalledOnce();
  });

  it("tem o título Mais para leitor de tela", () => {
    render(<MoreScreen />);

    expect(screen.getByRole("heading", { level: 1, name: "Mais" })).toBeInTheDocument();
  });

  it("fica de fora sem usuário na sessão", () => {
    mocks.useAuth.mockReturnValue({ user: null, isAuthenticated: false });

    const { container } = render(<MoreScreen />);

    expect(container).toBeEmptyDOMElement();
  });
});
