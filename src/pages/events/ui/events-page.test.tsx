import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_STATUSES, EVENT_TYPES } from "@/entities/event";
import { fetchEvents } from "@/entities/event/api/event.queries";
import { createEventAction } from "@/features/create-event/api";
import { deleteEventAction } from "@/features/delete-event";
import { publishEventAction } from "@/features/publish-event";
import { updateEventAction } from "@/features/update-event/api";

import { EventsPage } from "./events-page";

const authMock = vi.hoisted(() => ({
  role: "CIRCUIT_COORDINATOR",
}));

vi.mock("@/shared/auth", async () => {
  const actual = await vi.importActual<typeof import("@/shared/auth")>("@/shared/auth");

  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: "user-1",
        name: "Coordenador",
        email: "coord@test.com",
        role: authMock.role,
        isActive: true,
        circuitId: "circuit-1",
        congregationId: null,
      },
      isAuthenticated: true,
    }),
  };
});

vi.mock("@/entities/event/api/event.queries", () => ({
  fetchEvents: vi.fn(),
}));

vi.mock("@/features/create-event/api", () => ({
  createEventAction: vi.fn(),
}));

vi.mock("@/features/publish-event", () => ({
  publishEventAction: vi.fn(),
}));

vi.mock("@/features/update-event/api", () => ({
  updateEventAction: vi.fn(),
}));

vi.mock("@/features/delete-event", () => ({
  deleteEventAction: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const fetchEventsMock = vi.mocked(fetchEvents);
const createEventActionMock = vi.mocked(createEventAction);
const publishEventActionMock = vi.mocked(publishEventAction);
const updateEventActionMock = vi.mocked(updateEventAction);
const deleteEventActionMock = vi.mocked(deleteEventAction);

const draftEvent = {
  id: "event-1",
  title: "Assembleia SP 2026",
  type: EVENT_TYPES.ASSEMBLY,
  ticketPrice: "25.00",
  status: EVENT_STATUSES.DRAFT,
  registrationDeadline: "2026-06-01T00:00:00.000Z",
  paymentDeadline: "2026-06-15T00:00:00.000Z",
  venue: "Salão Central",
  address: "Rua das Flores, 100",
  city: "São Paulo",
  state: "SP",
  observations: null,
  circuitId: "circuit-1",
  createdById: "user-1",
  createdAt: "2026-05-21T00:00:00.000Z",
  updatedAt: "2026-05-21T00:00:00.000Z",
};

describe("EventsPage", () => {
  beforeEach(() => {
    authMock.role = "CIRCUIT_COORDINATOR";
    fetchEventsMock.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
    createEventActionMock.mockResolvedValue({ success: true, data: draftEvent });
    publishEventActionMock.mockResolvedValue({
      success: true,
      data: { ...draftEvent, status: EVENT_STATUSES.OPEN },
    });
    updateEventActionMock.mockResolvedValue({ success: true, data: draftEvent });
    deleteEventActionMock.mockResolvedValue({ success: true, data: undefined });
  });

  it("renderiza o heading Eventos", () => {
    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Eventos");
  });

  it("renderiza o botão de novo evento para papel de circuito", () => {
    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: /novo evento/i })).toBeInTheDocument();
  });

  it("exibe o skeleton enquanto carrega dados", () => {
    fetchEventsMock.mockReturnValue(new Promise(() => undefined));

    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("confirma publicação de evento em rascunho para papel de circuito", async () => {
    fetchEventsMock.mockResolvedValue({
      data: [draftEvent],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    render(<EventsPage />, { wrapper: createWrapper() });

    const publishButton = await screen.findByRole("button", { name: /publicar evento/i });
    fireEvent.click(publishButton);

    expect(screen.getByRole("dialog", { name: "Publicar Evento" })).toBeInTheDocument();
    expect(publishEventActionMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    await waitFor(() => {
      expect(publishEventActionMock).toHaveBeenCalledWith("event-1");
    });
  });

  it("oculta ações de escrita para papel de congregação", async () => {
    authMock.role = "CONGREGATION_COORDINATOR";
    fetchEventsMock.mockResolvedValue({
      data: [draftEvent],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    render(<EventsPage />, { wrapper: createWrapper() });

    expect(await screen.findByText("Assembleia SP 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /novo evento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /publicar evento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /excluir/i })).not.toBeInTheDocument();
  });

  it("abre modal de edição e envia alterações", async () => {
    fetchEventsMock.mockResolvedValue({
      data: [draftEvent],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    render(<EventsPage />, { wrapper: createWrapper() });

    fireEvent.click(await screen.findByRole("button", { name: /editar/i }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Novo título" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(updateEventActionMock).toHaveBeenCalledWith(
        "event-1",
        EVENT_STATUSES.DRAFT,
        expect.objectContaining({ title: "Novo título" }),
      );
    });
  });

  it("confirma exclusão de evento em rascunho", async () => {
    fetchEventsMock.mockResolvedValue({
      data: [draftEvent],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    render(<EventsPage />, { wrapper: createWrapper() });

    fireEvent.click(await screen.findByRole("button", { name: /excluir/i }));
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" }).at(-1)!);

    await waitFor(() => {
      expect(deleteEventActionMock).toHaveBeenCalledWith("event-1");
    });
  });
});
