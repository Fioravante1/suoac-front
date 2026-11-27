import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_ROLES } from "@/shared/auth";

import { PanelBottomNav } from "./panel-bottom-nav";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useAuthPermissions: vi.fn(),
  useSelectedEvent: vi.fn(),
  useEventOverview: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: mocks.usePathname }));
vi.mock("@/shared/auth", async (original) => ({
  ...(await original<typeof import("@/shared/auth")>()),
  useAuthPermissions: mocks.useAuthPermissions,
}));
vi.mock("@/features/select-event", () => ({ useSelectedEvent: mocks.useSelectedEvent }));
vi.mock("../../model", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../model")>()),
  useEventOverview: mocks.useEventOverview,
}));
vi.mock("../enroll-passenger-dialog", () => ({
  EnrollPassengerDialog: ({ event, onClose }: { event: { id: string }; onClose: () => void }) => (
    <div role="dialog" aria-label={`Inscrever em ${event.id}`}>
      <button type="button" onClick={onClose}>
        Fechar
      </button>
    </div>
  ),
}));

const event = { id: "event-1" };

function overview(canEnroll: boolean) {
  mocks.useEventOverview.mockReturnValue({
    status: "ready",
    event,
    canEnroll,
    enrollDisabledReason: canEnroll ? null : "As inscrições não estão abertas.",
  });
}

describe("PanelBottomNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usePathname.mockReturnValue("/dashboard");
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: true, userRole: USER_ROLES.CIRCUIT_COORDINATOR });
    mocks.useSelectedEvent.mockReturnValue({ event });
    overview(true);
  });

  it("monta, na ordem do desenho, Início, Passageiros, o + , Financeiro e Mais", () => {
    render(<PanelBottomNav />);

    const nav = screen.getByRole("navigation", { name: "Painel" });
    const [home, passengers, financial, more] = within(nav).getAllByRole("link");
    const fab = within(nav).getByRole("button", { name: "Cadastrar passageiro" });
    const follows = (earlier: HTMLElement | undefined, later: HTMLElement | undefined) =>
      Boolean(earlier && later && earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect([home, passengers, financial, more].map((link) => link?.textContent)).toEqual([
      "Início",
      "Passageiros",
      "Financeiro",
      "Mais",
    ]);
    expect(follows(passengers, fab)).toBe(true);
    expect(follows(fab, financial)).toBe(true);
  });

  it("leva cada item à rota dele, com Passageiros nos inscritos do evento", () => {
    render(<PanelBottomNav />);

    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Passageiros" })).toHaveAttribute("href", "/events/event-1#inscricoes");
    expect(screen.getByRole("link", { name: "Financeiro" })).toHaveAttribute("href", "/financial");
    expect(screen.getByRole("link", { name: "Mais" })).toHaveAttribute("href", "/more");
  });

  it("marca só o item da rota atual com aria-current", () => {
    mocks.usePathname.mockReturnValue("/financial");

    render(<PanelBottomNav />);

    const current = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page");

    expect(current.map((link) => link.textContent)).toEqual(["Financeiro"]);
  });

  it("deixa Mais ativo numa tela empilhada atrás dele", () => {
    mocks.usePathname.mockReturnValue("/congregations");

    render(<PanelBottomNav />);

    expect(screen.getByRole("link", { name: "Mais" })).toHaveAttribute("aria-current", "page");
  });

  it("abre o cadastro de passageiro pelo +, com o evento selecionado", () => {
    render(<PanelBottomNav />);

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar passageiro" }));

    expect(screen.getByRole("dialog", { name: "Inscrever em event-1" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mantém o cadastro aberto, com o evento de quando abriu, se a tela recarrega por baixo", () => {
    const { rerender } = render(<PanelBottomNav />);

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar passageiro" }));
    mocks.useEventOverview.mockReturnValue({ status: "loading" });
    rerender(<PanelBottomNav />);

    expect(screen.getByRole("dialog", { name: "Inscrever em event-1" })).toBeInTheDocument();

    mocks.useEventOverview.mockReturnValue({ status: "ready", event: { id: "event-2" }, canEnroll: false });
    rerender(<PanelBottomNav />);

    expect(screen.getByRole("dialog", { name: "Inscrever em event-1" })).toBeInTheDocument();
  });

  it("sem inscrições abertas, deixa o + desabilitado, com o motivo, e não abre o cadastro", () => {
    overview(false);

    render(<PanelBottomNav />);
    const fab = screen.getByRole("button", { name: "Cadastrar passageiro" });

    fireEvent.click(fab);

    expect(fab).toHaveAttribute("aria-disabled", "true");
    expect(fab).toHaveAccessibleDescription("As inscrições não estão abertas.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sem evento selecionado, leva Passageiros ao cadastro do circuito", () => {
    mocks.useSelectedEvent.mockReturnValue({ event: null });
    mocks.useEventOverview.mockReturnValue({ status: "hidden" });

    render(<PanelBottomNav />);

    expect(screen.getByRole("link", { name: "Passageiros" })).toHaveAttribute("href", "/passengers");
    expect(screen.getByRole("button", { name: "Cadastrar passageiro" })).toHaveAttribute("aria-disabled", "true");
  });

  it.each([USER_ROLES.CONGREGATION_COORDINATOR, USER_ROLES.CONGREGATION_ASSISTANT])(
    "navegação inferior própria para %s",
    (role) => {
      mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: false, userRole: role });
      render(<PanelBottomNav />);
      expect(screen.getByRole("link", { name: "Pagamentos" })).toHaveAttribute("href", "/financial");
      expect(Boolean(screen.queryByRole("link", { name: "Equipe" }))).toBe(
        role === USER_ROLES.CONGREGATION_COORDINATOR,
      );
      expect(screen.queryByRole("link", { name: "Congregações" })).not.toBeInTheDocument();
    },
  );
});
