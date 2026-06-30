import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { EVENT_STATUSES, EVENT_TYPES, type Event } from "@/entities/event";
import { USER_ROLES } from "@/shared/auth";

const toastSuccess = vi.fn();
const toastError = vi.fn();
const redirectToSessionExpired = vi.fn();
const downloadResponseAsFile = vi.fn();

vi.mock("@/shared/ui/toast", () => ({
  useToast: () => ({ success: toastSuccess, error: toastError, info: vi.fn(), warning: vi.fn(), dismiss: vi.fn() }),
}));

vi.mock("@/shared/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/auth")>()),
  redirectToSessionExpired: () => redirectToSessionExpired(),
}));

vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/lib")>()),
  downloadResponseAsFile: (...args: unknown[]) => downloadResponseAsFile(...args),
}));

vi.mock("@/entities/congregation", () => ({
  congregationSelectOptions: () => ({ queryKey: ["congregations", "select"], queryFn: vi.fn(), enabled: true }),
}));

vi.mock("@/shared/api", () => ({
  useQuery: () => ({
    data: { data: [{ id: "cong-1", name: "Congregação A" }] },
    isLoading: false,
    isError: false,
  }),
}));

import { ExportPassengersButton } from "./export-passengers-button";

const event: Event = {
  id: "evt-1",
  title: "Congresso",
  type: EVENT_TYPES.REGIONAL_CONVENTION,
  ticketPrice: "75.00",
  status: EVENT_STATUSES.OPEN,
  registrationDeadline: "2026-06-15T00:00:00.000Z",
  paymentDeadline: "2026-07-01T00:00:00.000Z",
  venue: "Salão",
  address: "Rua 1",
  city: "São Paulo",
  state: "SP",
  observations: null,
  circuitId: "circuit-1",
  createdById: "u-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  days: [],
};

function okResponse(): Response {
  return { ok: true, status: 200 } as Response;
}

function errorResponse(status: number, message?: string): Response {
  return { ok: false, status, json: async () => ({ message }) } as unknown as Response;
}

describe("ExportPassengersButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("role de congregação: exporta a lista de embarque direto, sem modal nem variante carrier", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    render(<ExportPassengersButton event={event} userRole={USER_ROLES.CONGREGATION_COORDINATOR} />);

    expect(screen.queryByText("Lista para a empresa de ônibus")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Lista de embarque/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith("/api/events/evt-1/passengers/export?variant=boarding", {
      credentials: "same-origin",
    });
    expect(downloadResponseAsFile).toHaveBeenCalledOnce();
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("role de circuito: abre modal e baixa a variante carrier", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    render(<ExportPassengersButton event={event} userRole={USER_ROLES.CIRCUIT_COORDINATOR} />);

    fireEvent.click(screen.getByRole("button", { name: /Exportar PDF/ }));

    fireEvent.click(screen.getByRole("button", { name: /Lista para a empresa de ônibus/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith("/api/events/evt-1/passengers/export?variant=carrier", {
      credentials: "same-origin",
    });
  });

  it("role de circuito: baixa a variante boarding pelo modal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);

    render(<ExportPassengersButton event={event} userRole={USER_ROLES.CIRCUIT_COORDINATOR} />);

    fireEvent.click(screen.getByRole("button", { name: /Exportar PDF/ }));
    fireEvent.click(screen.getByRole("button", { name: /Lista de embarque/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith("/api/events/evt-1/passengers/export?variant=boarding", {
      credentials: "same-origin",
    });
  });

  it("mostra toast de erro com a mensagem mapeada em 403", async () => {
    const fetchMock = vi.fn().mockResolvedValue(errorResponse(403));
    vi.stubGlobal("fetch", fetchMock);

    render(<ExportPassengersButton event={event} userRole={USER_ROLES.CONGREGATION_COORDINATOR} />);
    fireEvent.click(screen.getByRole("button", { name: /Lista de embarque/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Você não tem permissão para esta exportação."));
    expect(downloadResponseAsFile).not.toHaveBeenCalled();
  });

  it("mostra toast de erro mapeado para variante inválida (400)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(errorResponse(400));
    vi.stubGlobal("fetch", fetchMock);

    render(<ExportPassengersButton event={event} userRole={USER_ROLES.CONGREGATION_COORDINATOR} />);
    fireEvent.click(screen.getByRole("button", { name: /Lista de embarque/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Opção de exportação inválida."));
  });

  it("usa a mensagem do backend no 422", async () => {
    const fetchMock = vi.fn().mockResolvedValue(errorResponse(422, "O evento possui 3000 inscritos."));
    vi.stubGlobal("fetch", fetchMock);

    render(<ExportPassengersButton event={event} userRole={USER_ROLES.CONGREGATION_COORDINATOR} />);
    fireEvent.click(screen.getByRole("button", { name: /Lista de embarque/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("O evento possui 3000 inscritos."));
  });

  it("redireciona para sessão expirada no 401", async () => {
    const fetchMock = vi.fn().mockResolvedValue(errorResponse(401));
    vi.stubGlobal("fetch", fetchMock);

    render(<ExportPassengersButton event={event} userRole={USER_ROLES.CONGREGATION_COORDINATOR} />);
    fireEvent.click(screen.getByRole("button", { name: /Lista de embarque/ }));

    await waitFor(() => expect(redirectToSessionExpired).toHaveBeenCalledOnce());
    expect(toastError).not.toHaveBeenCalled();
  });
});
