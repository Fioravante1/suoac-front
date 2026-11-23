import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Event } from "@/entities/event";
import { USER_ROLES } from "@/shared/auth";

const mocks = vi.hoisted(() => ({ useAuth: vi.fn(), useWorkingEvent: vi.fn(), refetch: vi.fn() }));

vi.mock("@/shared/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/auth")>()),
  useAuthPermissions: mocks.useAuth,
}));
vi.mock("@/features/select-event", () => ({ useWorkingEvent: mocks.useWorkingEvent }));
vi.mock("@/features/export-event-passengers", () => ({
  ExportPassengersButton: ({ event, userRole }: { event: Event; userRole: string }) => (
    <button type="button">
      Exportar {event.id} como {userRole}
    </button>
  ),
}));

import { ListsPage } from "./lists-page";

const event = { id: "event-1", title: "Congresso Regional 2026" } as Event;

function workingEvent(state: Partial<{ event: Event | null; isLoading: boolean; isError: boolean }>) {
  mocks.useWorkingEvent.mockReturnValue({
    event: undefined,
    isLoading: false,
    isError: false,
    refetch: mocks.refetch,
    selection: null,
    ...state,
  });
}

describe("ListsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({ userCircuitId: "circuit-1", userRole: USER_ROLES.CIRCUIT_COORDINATOR });
  });

  it("oferece a exportação de inscritos do evento em que o painel trabalha", () => {
    workingEvent({ event });

    render(<ListsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Listas e exportações" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Inscritos de Congresso Regional 2026" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar event-1 como CIRCUIT_COORDINATOR" })).toBeInTheDocument();
    expect(mocks.useWorkingEvent).toHaveBeenCalledWith("circuit-1");
  });

  it("mostra o carregamento enquanto o evento não chega", () => {
    workingEvent({ isLoading: true });

    render(<ListsPage />);

    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Exportar/ })).not.toBeInTheDocument();
  });

  it("explica a falha e deixa tentar de novo", () => {
    workingEvent({ isError: true });

    render(<ListsPage />);

    expect(screen.getByText("Não foi possível carregar o evento")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it("orienta quando o circuito não tem evento", () => {
    workingEvent({ event: null });

    render(<ListsPage />);

    expect(screen.getByRole("heading", { name: "Nenhum evento para exportar" })).toBeInTheDocument();
    // O shell atual não tem seletor de evento: o texto não pode mandar escolher um.
    expect(screen.getByText(/quando houver um evento em andamento no circuito/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Exportar/ })).not.toBeInTheDocument();
  });
});
