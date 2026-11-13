import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { USER_ROLES, type SessionUser, type UserRole } from "@/shared/auth";

const mocks = vi.hoisted(() => ({ useAuth: vi.fn(), useSignOut: vi.fn(), signOut: vi.fn() }));

vi.mock("@/shared/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/auth")>()),
  useAuth: mocks.useAuth,
}));
vi.mock("../../model", () => ({ useSignOut: mocks.useSignOut }));
vi.mock("../account-circuit", () => ({
  AccountCircuit: ({ circuitId }: { circuitId: string }) => <div>Circuito de {circuitId}</div>,
}));

import { AccountMenu } from "./account-menu";

const coordinator: SessionUser = {
  id: "user-1",
  name: "Marcos Oliveira",
  email: "marcos.oliveira@gmail.com",
  role: USER_ROLES.CIRCUIT_COORDINATOR,
  isActive: true,
  circuitId: "circuit-1",
  congregationId: null,
};

function mockSession(user: SessionUser | null, { isSigningOut = false } = {}) {
  mocks.useAuth.mockReturnValue({ user, isAuthenticated: user !== null });
  mocks.useSignOut.mockReturnValue({ signOut: mocks.signOut, isSigningOut });
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Conta de Marcos Oliveira" }));

  return screen.getByRole("group", { name: "Conta" });
}

describe("AccountMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não aparece sem ninguém na sessão", () => {
    mockSession(null);

    const { container } = render(<AccountMenu />);

    expect(container).toBeEmptyDOMElement();
  });

  it("mostra o avatar com as iniciais, fechado", () => {
    mockSession(coordinator);

    render(<AccountMenu />);

    const trigger = screen.getByRole("button", { name: "Conta de Marcos Oliveira" });
    expect(trigger).toHaveTextContent("MO");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "Conta" })).not.toBeInTheDocument();
  });

  it("abre com quem está na sessão, o privilégio por extenso e o circuito", () => {
    mockSession(coordinator);
    render(<AccountMenu />);

    const panel = openMenu();

    expect(screen.getByRole("button", { name: "Conta de Marcos Oliveira" })).toHaveAttribute("aria-expanded", "true");
    expect(within(panel).getByText("Marcos Oliveira")).toBeInTheDocument();
    expect(within(panel).getByText("marcos.oliveira@gmail.com")).toBeInTheDocument();
    expect(within(panel).getByText("Coordenador do arranjo de ônibus no circuito")).toBeInTheDocument();
    expect(within(panel).getByText("Circuito de circuit-1")).toBeInTheDocument();
  });

  it.each<[UserRole, string]>([
    [USER_ROLES.CIRCUIT_ASSISTANT, "Assistente do arranjo de ônibus no circuito"],
    [USER_ROLES.CONGREGATION_COORDINATOR, "Coordenador do arranjo de ônibus na congregação"],
    [USER_ROLES.CONGREGATION_ASSISTANT, "Assistente do arranjo de ônibus na congregação"],
  ])("escreve o privilégio de %s por extenso", (role, label) => {
    mockSession({ ...coordinator, role });
    render(<AccountMenu />);

    expect(within(openMenu()).getByText(label)).toBeInTheDocument();
  });

  it.each(["Meu perfil", "Alterar senha"])("mostra %s desabilitado, avisando que chega em breve", (item) => {
    mockSession(coordinator);
    render(<AccountMenu />);

    const action = within(openMenu()).getByRole("button", { name: new RegExp(item) });

    expect(action).toHaveAttribute("aria-disabled", "true");
    expect(action).toHaveTextContent("Em breve");
  });

  it("não leva à troca de senha do primeiro acesso, que a guarda de rota recusa", () => {
    mockSession(coordinator);
    render(<AccountMenu />);

    expect(within(openMenu()).queryByRole("link", { name: /Alterar senha/ })).not.toBeInTheDocument();
  });

  it("Esc fecha o menu e devolve o foco ao avatar", () => {
    mockSession(coordinator);
    render(<AccountMenu />);
    const panel = openMenu();

    fireEvent.keyDown(within(panel).getByRole("button", { name: "Sair" }), { key: "Escape" });

    expect(screen.queryByRole("group", { name: "Conta" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conta de Marcos Oliveira" })).toHaveFocus();
  });

  it("Esc fecha mesmo com o foco fora do menu, como no Safari depois de abrir com o mouse", () => {
    mockSession(coordinator);
    render(<AccountMenu />);
    openMenu();

    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(screen.queryByRole("group", { name: "Conta" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conta de Marcos Oliveira" })).toHaveFocus();
  });

  it("fecha ao clicar fora e continua aberto ao clicar dentro", () => {
    mockSession(coordinator);
    render(
      <>
        <AccountMenu />
        <p>Fora do menu</p>
      </>,
    );
    const panel = openMenu();

    fireEvent.pointerDown(within(panel).getByText("Marcos Oliveira"));
    expect(screen.getByRole("group", { name: "Conta" })).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByText("Fora do menu"));
    expect(screen.queryByRole("group", { name: "Conta" })).not.toBeInTheDocument();
  });

  it("fecha quando o foco sai do menu pelo Tab", () => {
    mockSession(coordinator);
    render(
      <>
        <AccountMenu />
        <button type="button">Depois do menu</button>
      </>,
    );
    const panel = openMenu();

    fireEvent.blur(within(panel).getByRole("button", { name: "Sair" }), {
      relatedTarget: screen.getByRole("button", { name: "Depois do menu" }),
    });

    expect(screen.queryByRole("group", { name: "Conta" })).not.toBeInTheDocument();
  });

  it("continua aberto quando o foco anda entre os itens do menu", () => {
    mockSession(coordinator);
    render(<AccountMenu />);
    const panel = openMenu();

    fireEvent.blur(within(panel).getByRole("button", { name: /Alterar senha/ }), {
      relatedTarget: within(panel).getByRole("button", { name: "Sair" }),
    });

    expect(screen.getByRole("group", { name: "Conta" })).toBeInTheDocument();
  });

  it("Sair chama a saída", () => {
    mockSession(coordinator);
    render(<AccountMenu />);

    fireEvent.click(within(openMenu()).getByRole("button", { name: "Sair" }));

    expect(mocks.signOut).toHaveBeenCalledOnce();
  });

  it("enquanto sai, cobre a tela com o aviso e desabilita Sair", () => {
    mockSession(coordinator, { isSigningOut: true });
    render(<AccountMenu />);

    const signOut = within(openMenu()).getByRole("button", { name: "Sair" });

    expect(signOut).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Saindo...");
  });
});
