import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_STATUSES, EVENT_TYPES } from "@/entities/event";
import { fetchEvents } from "@/entities/event/api";
import { publishEventAction } from "@/features/publish-event";

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
const publishEventActionMock = vi.mocked(publishEventAction);

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
    publishEventActionMock.mockResolvedValue({
      success: true,
      data: { ...draftEvent, status: EVENT_STATUSES.OPEN },
    });
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

  it("exibe ação para publicar evento em evento rascunho para papel de circuito", async () => {
    fetchEventsMock.mockResolvedValue({
      data: [draftEvent],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    render(<EventsPage />, { wrapper: createWrapper() });

    const publishButton = await screen.findByRole("button", { name: /publicar evento/i });
    fireEvent.click(publishButton);

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
  });
});
