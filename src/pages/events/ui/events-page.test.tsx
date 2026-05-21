import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchEvents } from "@/entities/event/api";

import { EventsPage } from "./events-page";

vi.mock("@/shared/auth", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      name: "Coordenador",
      email: "coord@test.com",
      role: "CIRCUIT_COORDINATOR",
      isActive: true,
      circuitId: "circuit-1",
      congregationId: null,
    },
    isAuthenticated: true,
  }),
}));

vi.mock("@/entities/event/api/event.queries", () => ({
  fetchEvents: vi.fn(),
}));

vi.mock("@/features/create-event/api", () => ({
  createEventAction: vi.fn(),
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

describe("EventsPage", () => {
  beforeEach(() => {
    fetchEventsMock.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
  });

  it("renderiza o heading Eventos", () => {
    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Eventos");
  });

  it("renderiza o botão de novo evento", () => {
    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: /novo evento/i })).toBeInTheDocument();
  });

  it("exibe o skeleton enquanto carrega dados", () => {
    fetchEventsMock.mockReturnValue(new Promise(() => undefined));

    render(<EventsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
