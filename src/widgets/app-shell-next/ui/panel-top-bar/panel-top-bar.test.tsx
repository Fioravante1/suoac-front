import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_ROLES, type SessionUser } from "@/shared/auth";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useAuthPermissions: vi.fn(),
  useQuery: vi.fn(),
  useEventSwitcher: vi.fn(),
  prefetchEvents: vi.fn(),
}));

vi.mock("@/shared/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/auth")>()),
  useAuth: mocks.useAuth,
  useAuthPermissions: mocks.useAuthPermissions,
}));
vi.mock("@/shared/api", () => ({ useQuery: mocks.useQuery }));
vi.mock("@/entities/circuit", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/circuit")>();

  return { ...original, ownCircuitOptions: (circuitId: string) => ({ queryKey: ["circuit", circuitId] }) };
});
vi.mock("@/features/select-event", () => ({
  useEventSwitcher: mocks.useEventSwitcher,
  EventSwitcherSheet: ({ open }: { open: boolean }) => open && <div role="dialog" aria-label="Eventos do circuito" />,
}));

import { PanelTopBar } from "./panel-top-bar";

const coordinator: SessionUser = {
  id: "user-1",
  name: "Marcos Oliveira",
  email: "marcos.oliveira@gmail.com",
  role: USER_ROLES.CIRCUIT_COORDINATOR,
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

function switcher(overrides: Record<string, unknown> = {}) {
  mocks.useEventSwitcher.mockReturnValue({
    current: { id: "event-1", title: "Assembleia de Circuito", statusVariant: "success" },
    isCurrentLoading: false,
    isSelecting: false,
    prefetchEvents: mocks.prefetchEvents,
    ...overrides,
  });
}

describe("PanelTopBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({ user: coordinator, isAuthenticated: true });
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: true });
    mocks.useQuery.mockReturnValue({ data: { id: "circuit-1", name: "SP-17", city: "Campinas", state: "SP" } });
    switcher();
  });

  it("mostra o circuito e o evento selecionado", () => {
    render(<PanelTopBar />);

    const eventButton = screen.getByRole("button", { name: /Assembleia de Circuito/ });

    expect(within(eventButton).getByText("Circuito SP-17")).toBeInTheDocument();
  });

  it("abre a sheet de eventos pelo nome do evento", () => {
    render(<PanelTopBar />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Assembleia de Circuito/ }));

    expect(screen.getByRole("dialog", { name: "Eventos do circuito" })).toBeInTheDocument();
    expect(mocks.useEventSwitcher).toHaveBeenLastCalledWith({ isOpen: true });
  });

  it("busca a lista de eventos antes de a sheet abrir", () => {
    render(<PanelTopBar />);

    fireEvent.pointerEnter(screen.getByRole("button", { name: /Assembleia de Circuito/ }));

    expect(mocks.prefetchEvents).toHaveBeenCalled();
  });

  it("leva o avatar à tela Mais", () => {
    render(<PanelTopBar />);

    expect(screen.getByRole("link", { name: "Conta de Marcos Oliveira" })).toHaveAttribute("href", "/more");
    expect(screen.getByText("MO")).toBeInTheDocument();
  });

  it("deixa busca e notificações como Em breve, desabilitadas", () => {
    render(<PanelTopBar />);

    expect(screen.getByRole("button", { name: "Buscar" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Notificações" })).toHaveAttribute("aria-disabled", "true");
  });

  it("avisa quando o circuito não tem evento ativo", () => {
    switcher({ current: null });

    render(<PanelTopBar />);

    expect(screen.getByRole("button", { name: /Nenhum evento ativo/ })).toBeInTheDocument();
  });

  it("avisa enquanto o evento carrega e quando a resolução falha", () => {
    switcher({ current: undefined, isCurrentLoading: true });
    const { rerender } = render(<PanelTopBar />);

    expect(screen.getByRole("button", { name: /Carregando evento…/ })).toBeInTheDocument();

    switcher({ current: undefined, isCurrentLoading: false });
    rerender(<PanelTopBar />);

    expect(screen.getByRole("button", { name: /Escolha um evento/ })).toBeInTheDocument();
  });

  it("não mostra o circuito antes de ele chegar", () => {
    mocks.useQuery.mockReturnValue({ data: undefined });

    render(<PanelTopBar />);

    expect(screen.queryByText(/^Circuito /)).not.toBeInTheDocument();
  });

  it("fica de fora para os papéis da congregação, que têm a navegação do SUC-113, sem buscar o circuito", () => {
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: false });

    const { container } = render(<PanelTopBar />);

    expect(container).toBeEmptyDOMElement();
    expect(mocks.useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it("busca o circuito para o circuito", () => {
    render(<PanelTopBar />);

    expect(mocks.useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });
});
