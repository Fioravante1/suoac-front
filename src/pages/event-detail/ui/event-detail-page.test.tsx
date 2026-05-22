import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_DAY_STATUSES, EVENT_STATUSES, EVENT_TYPES } from "@/entities/event";
import { fetchEvent } from "@/entities/event/api/event.queries";
import { deleteEventAction } from "@/features/delete-event";
import { publishEventAction } from "@/features/publish-event";
import { updateEventAction } from "@/features/update-event/api";

import { EventDetailPage } from "./event-detail-page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

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
  fetchEvent: vi.fn(),
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

const fetchEventMock = vi.mocked(fetchEvent);
const publishEventActionMock = vi.mocked(publishEventAction);
const updateEventActionMock = vi.mocked(updateEventAction);
const deleteEventActionMock = vi.mocked(deleteEventAction);

const eventWithDays = {
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
  observations: "Levar documento com foto",
  circuitId: "circuit-1",
  createdById: "user-1",
  createdAt: "2026-05-21T00:00:00.000Z",
  updatedAt: "2026-05-21T00:00:00.000Z",
  days: [
    {
      id: "day-1",
      dayNumber: 1,
      date: "2026-07-10T00:00:00.000Z",
      label: "Dia 1 - Sexta-feira",
      departureTime: "06:00",
      returnTime: "18:00",
      status: EVENT_DAY_STATUSES.ACTIVE,
      eventId: "event-1",
    },
    {
      id: "day-2",
      dayNumber: 2,
      date: "2026-07-11T00:00:00.000Z",
      label: "Dia 2 - Sábado",
      departureTime: "06:00",
      returnTime: "20:00",
      status: EVENT_DAY_STATUSES.CANCELLED,
      eventId: "event-1",
    },
  ],
};

describe("EventDetailPage", () => {
  beforeEach(() => {
    authMock.role = "CIRCUIT_COORDINATOR";
    fetchEventMock.mockResolvedValue(eventWithDays);
    publishEventActionMock.mockResolvedValue({
      success: true,
      data: { ...eventWithDays, status: EVENT_STATUSES.OPEN },
    });
    updateEventActionMock.mockResolvedValue({ success: true, data: eventWithDays });
    deleteEventActionMock.mockResolvedValue({ success: true, data: undefined });
    pushMock.mockClear();
  });

  it("renderiza título e badge de status", async () => {
    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Assembleia SP 2026");
    expect(screen.getByText("Rascunho")).toBeInTheDocument();
  });

  it("exibe local com venue, cidade e estado", async () => {
    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Salão Central")).toBeInTheDocument();
    expect(screen.getByText("Rua das Flores, 100")).toBeInTheDocument();
    expect(screen.getByText("São Paulo - SP")).toBeInTheDocument();
  });

  it("exibe dias do evento com labels e horários", async () => {
    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Dia 1 - Sexta-feira")).toBeInTheDocument();
    expect(screen.getByText("Dia 2 - Sábado")).toBeInTheDocument();
    expect(screen.getAllByText(/Saída: 06:00/)).toHaveLength(2);
    expect(screen.getByText(/Retorno: 18:00/)).toBeInTheDocument();
    expect(screen.getByText(/Retorno: 20:00/)).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  it("exibe skeleton enquanto carrega", () => {
    fetchEventMock.mockReturnValue(new Promise(() => undefined));

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("exibe ErrorState em caso de erro", async () => {
    fetchEventMock.mockRejectedValue(new Error("Network error"));

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Não foi possível carregar o evento")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it("mostra ações de editar, excluir e publicar para papel de circuito", async () => {
    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByRole("button", { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /excluir/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publicar evento/i })).toBeInTheDocument();
  });

  it("oculta ações para papel de congregação", async () => {
    authMock.role = "CONGREGATION_COORDINATOR";

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Assembleia SP 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /excluir/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /publicar evento/i })).not.toBeInTheDocument();
  });

  it("botão excluir aparece apenas para evento em rascunho", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.OPEN });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Assembleia SP 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /excluir/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /publicar evento/i })).not.toBeInTheDocument();
  });

  it("confirma exclusão e redireciona para listagem", async () => {
    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    fireEvent.click(await screen.findByRole("button", { name: /excluir/i }));

    expect(screen.getByRole("dialog", { name: "Excluir Evento" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" }).at(-1)!);

    await waitFor(() => {
      expect(deleteEventActionMock).toHaveBeenCalledWith("event-1");
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/events");
    });
  });

  it("exibe observações quando presentes", async () => {
    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Levar documento com foto")).toBeInTheDocument();
  });
});
