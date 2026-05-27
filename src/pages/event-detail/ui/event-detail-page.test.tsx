import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_DAY_STATUSES, EVENT_STATUSES, EVENT_TYPES } from "@/entities/event";
import { fetchEvent } from "@/entities/event/api/event.queries";
import { cancelEventAction } from "@/features/cancel-event";
import { cancelEventDayAction } from "@/features/cancel-event-day";
import { deleteEventAction } from "@/features/delete-event";
import { publishEventAction } from "@/features/publish-event";
import { updateEventAction } from "@/features/update-event/api";
import { updateEventDayAction } from "@/features/update-event-day/api";

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
    useAuthPermissions: () => {
      const user = {
        id: "user-1",
        name: "Coordenador",
        email: "coord@test.com",
        role: authMock.role,
        isActive: true,
        circuitId: "circuit-1",
        congregationId: null,
      };

      return {
        user,
        userRole: authMock.role,
        userCircuitId: user.circuitId,
        userCongregationId: user.congregationId,
        isAuthenticated: true,
        isCircuitUser: authMock.role === "CIRCUIT_COORDINATOR" || authMock.role === "CIRCUIT_ASSISTANT",
        isCircuitCoordinator: authMock.role === "CIRCUIT_COORDINATOR",
      };
    },
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

vi.mock("@/features/update-event-day/api", () => ({
  updateEventDayAction: vi.fn(),
}));

vi.mock("@/features/cancel-event", () => ({
  cancelEventAction: vi.fn(),
}));

vi.mock("@/features/cancel-event-day", () => ({
  cancelEventDayAction: vi.fn(),
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
const cancelEventActionMock = vi.mocked(cancelEventAction);
const updateEventDayActionMock = vi.mocked(updateEventDayAction);
const cancelEventDayActionMock = vi.mocked(cancelEventDayAction);

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
    cancelEventActionMock.mockResolvedValue({
      success: true,
      data: { ...eventWithDays, status: EVENT_STATUSES.CANCELLED },
    });
    updateEventDayActionMock.mockResolvedValue({
      success: true,
      data: { ...eventWithDays.days[0], departureTime: "07:00" },
    });
    cancelEventDayActionMock.mockResolvedValue({
      success: true,
      data: { ...eventWithDays.days[0], status: EVENT_DAY_STATUSES.CANCELLED },
    });
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

    expect(await screen.findByRole("button", { name: /^editar$/i })).toBeInTheDocument();
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

  it("exibe botões de editar horários e cancelar dia para circuito em OPEN", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.OPEN });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Dia 1 - Sexta-feira")).toBeInTheDocument();

    const editButtons = screen.getAllByRole("button", { name: /editar horários/i });
    const cancelButtons = screen.getAllByRole("button", { name: /cancelar dia/i });

    expect(editButtons).toHaveLength(1);
    expect(cancelButtons).toHaveLength(1);
  });

  it("exibe editar horários mas oculta cancelar dia para circuito em DRAFT", async () => {
    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Dia 1 - Sexta-feira")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /editar horários/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar dia/i })).not.toBeInTheDocument();
  });

  it("oculta botões de editar horários e cancelar dia para congregação", async () => {
    authMock.role = "CONGREGATION_COORDINATOR";

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Dia 1 - Sexta-feira")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar horários/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar dia/i })).not.toBeInTheDocument();
  });

  it("oculta apenas botão de cancelar dia para assistente de circuito", async () => {
    authMock.role = "CIRCUIT_ASSISTANT";

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Dia 1 - Sexta-feira")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /editar horários/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar dia/i })).not.toBeInTheDocument();
  });

  it("oculta editar horários para dia cancelado", async () => {
    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Dia 2 - Sábado")).toBeInTheDocument();

    const editButtons = screen.getAllByRole("button", { name: /editar horários/i });

    expect(editButtons).toHaveLength(1);
  });

  it("oculta botões de dia para evento CLOSED", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.CLOSED });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Dia 1 - Sexta-feira")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar horários/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar dia/i })).not.toBeInTheDocument();
  });

  it("oculta botões de dia para evento FINISHED", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.FINISHED });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Dia 1 - Sexta-feira")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar horários/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar dia/i })).not.toBeInTheDocument();
  });

  it("abre modal de editar horários ao clicar no botão", async () => {
    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    fireEvent.click(await screen.findByRole("button", { name: /editar horários/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Editar horários — Dia 1 - Sexta-feira/)).toBeInTheDocument();
  });

  it("abre ConfirmDialog de cancelar dia ao clicar no botão", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.OPEN });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    fireEvent.click(await screen.findByRole("button", { name: /cancelar dia/i }));

    expect(screen.getByRole("dialog", { name: "Cancelar Dia" })).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja cancelar/)).toBeInTheDocument();
  });

  it("confirma cancelamento de dia e chama cancelEventDayAction", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.OPEN });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    fireEvent.click(await screen.findByRole("button", { name: /cancelar dia/i }));

    const dialog = screen.getByRole("dialog", { name: "Cancelar Dia" });
    expect(dialog).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: /cancelar dia/i });
    fireEvent.click(confirmButtons.at(-1)!);

    await waitFor(() => {
      expect(cancelEventDayActionMock).toHaveBeenCalledWith("day-1");
    });
  });

  it("oculta botão cancelar evento para coordenador em DRAFT", async () => {
    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Assembleia SP 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar evento/i })).not.toBeInTheDocument();
  });

  it("exibe botão cancelar evento para coordenador em OPEN", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.OPEN });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByRole("button", { name: /cancelar evento/i })).toBeInTheDocument();
  });

  it("oculta botão cancelar evento para assistente de circuito", async () => {
    authMock.role = "CIRCUIT_ASSISTANT";

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Assembleia SP 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar evento/i })).not.toBeInTheDocument();
  });

  it("oculta botão cancelar evento para congregação", async () => {
    authMock.role = "CONGREGATION_COORDINATOR";

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Assembleia SP 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar evento/i })).not.toBeInTheDocument();
  });

  it("oculta botão cancelar evento para CLOSED", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.CLOSED });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Assembleia SP 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar evento/i })).not.toBeInTheDocument();
  });

  it("oculta botão cancelar evento para FINISHED", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.FINISHED });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Assembleia SP 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar evento/i })).not.toBeInTheDocument();
  });

  it("oculta botão cancelar evento para CANCELLED", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.CANCELLED });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    expect(await screen.findByText("Assembleia SP 2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar evento/i })).not.toBeInTheDocument();
  });

  it("abre dialog de cancelar evento e chama cancelEventAction", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.OPEN });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    fireEvent.click(await screen.findByRole("button", { name: /cancelar evento/i }));

    expect(screen.getByRole("dialog", { name: "Cancelar Evento" })).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole("button", { name: /cancelar evento/i });
    fireEvent.click(confirmButtons.at(-1)!);

    await waitFor(() => {
      expect(cancelEventActionMock).toHaveBeenCalledWith("event-1");
    });
  });

  it("mostra aviso de último dia ativo no dialog de cancelar dia", async () => {
    fetchEventMock.mockResolvedValue({ ...eventWithDays, status: EVENT_STATUSES.OPEN });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    fireEvent.click(await screen.findByRole("button", { name: /cancelar dia/i }));

    expect(screen.getByText(/Este é o último dia ativo/)).toBeInTheDocument();
  });

  it("não mostra aviso de último dia ativo quando há mais de um dia ativo", async () => {
    fetchEventMock.mockResolvedValue({
      ...eventWithDays,
      status: EVENT_STATUSES.OPEN,
      days: [{ ...eventWithDays.days[0] }, { ...eventWithDays.days[1], status: EVENT_DAY_STATUSES.ACTIVE }],
    });

    render(<EventDetailPage eventId="event-1" />, { wrapper: createWrapper() });

    fireEvent.click((await screen.findAllByRole("button", { name: /cancelar dia/i }))[0]);

    expect(screen.queryByText(/Este é o último dia ativo/)).not.toBeInTheDocument();
  });
});
