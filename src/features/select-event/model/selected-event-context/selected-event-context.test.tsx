import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Event } from "@/entities/event";

const mocks = vi.hoisted(() => ({
  resolveSelectedEventAction: vi.fn(),
  selectEventAction: vi.fn(),
  fetchEvent: vi.fn(),
}));

// O conteúdo do evento selecionado vem do detalhe, que busca por `fetchEvent`.
vi.mock("@/entities/event/api/event.queries", () => ({ fetchEvent: mocks.fetchEvent, fetchEvents: vi.fn() }));

vi.mock("@/shared/auth", () => ({
  useAuthPermissions: () => ({ userCircuitId: "circuit-1" }),
}));

vi.mock("../../api/resolve-selected-event-action", () => ({
  resolveSelectedEventAction: mocks.resolveSelectedEventAction,
}));

vi.mock("../../api/select-event-action", () => ({
  selectEventAction: mocks.selectEventAction,
}));

import { SelectedEventProvider, useSelectedEvent } from "./selected-event-context";

function buildEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "evt-1",
    title: "Assembleia de circuito",
    type: "ASSEMBLY",
    ticketPrice: "25.00",
    status: "OPEN",
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
    ...overrides,
  };
}

let lastSelectResult: unknown;

function SelectedEventProbe() {
  const selected = useSelectedEvent();

  if (!selected) return <p>fora do shell novo</p>;

  return (
    <>
      <p>evento: {selected.event === undefined ? "indefinido" : (selected.event?.title ?? "nenhum")}</p>
      {selected.isLoading && <p>carregando</p>}
      {selected.isError && <p>falhou</p>}
      <button type="button" onClick={() => selected.refetch()}>
        Tentar de novo
      </button>
      <button
        type="button"
        onClick={async () => {
          lastSelectResult = await selected.selectEvent("evt-2");
        }}
      >
        Trocar
      </button>
    </>
  );
}

function renderWithProvider(children: ReactNode) {
  // Mesmo `staleTime` do query client da aplicação: dado recém-chegado não é buscado de novo.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } } });

  render(
    <QueryClientProvider client={queryClient}>
      <SelectedEventProvider>{children}</SelectedEventProvider>
    </QueryClientProvider>,
  );

  return queryClient;
}

describe("SelectedEventProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastSelectResult = undefined;
  });

  it("fora do provider, useSelectedEvent devolve null para as telas v1 seguirem como antes", () => {
    render(<SelectedEventProbe />);

    expect(screen.getByText("fora do shell novo")).toBeInTheDocument();
  });

  it("expõe o evento resolvido depois de carregar", async () => {
    mocks.resolveSelectedEventAction.mockResolvedValue(buildEvent());

    renderWithProvider(<SelectedEventProbe />);

    expect(screen.getByText("carregando")).toBeInTheDocument();
    expect(await screen.findByText("evento: Assembleia de circuito")).toBeInTheDocument();
  });

  it("expõe null quando o circuito não tem evento atual", async () => {
    mocks.resolveSelectedEventAction.mockResolvedValue(null);

    renderWithProvider(<SelectedEventProbe />);

    expect(await screen.findByText("evento: nenhum")).toBeInTheDocument();
  });

  it("troca o evento na hora, com o evento devolvido pela troca, sem resolver de novo", async () => {
    mocks.resolveSelectedEventAction.mockResolvedValue(buildEvent());
    mocks.selectEventAction.mockResolvedValue({
      success: true,
      data: buildEvent({ id: "evt-2", title: "Congresso regional" }),
    });

    renderWithProvider(<SelectedEventProbe />);
    await screen.findByText("evento: Assembleia de circuito");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Trocar" }));
    });

    expect(await screen.findByText("evento: Congresso regional")).toBeInTheDocument();
    expect(mocks.selectEventAction).toHaveBeenCalledWith("evt-2");
    expect(mocks.resolveSelectedEventAction).toHaveBeenCalledTimes(1);
    expect(mocks.fetchEvent).not.toHaveBeenCalled();
  });

  it("mantém o evento quando a troca falha e devolve o erro a quem chamou", async () => {
    mocks.resolveSelectedEventAction.mockResolvedValue(buildEvent());
    mocks.selectEventAction.mockResolvedValue({ success: false, error: "Evento não encontrado." });

    renderWithProvider(<SelectedEventProbe />);
    await screen.findByText("evento: Assembleia de circuito");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Trocar" }));
    });

    expect(screen.getByText("evento: Assembleia de circuito")).toBeInTheDocument();
    expect(lastSelectResult).toEqual({ success: false, error: "Evento não encontrado." });
  });

  it("devolve falha, sem rejeitar, quando a chamada da troca nem chega ao servidor", async () => {
    mocks.resolveSelectedEventAction.mockResolvedValue(buildEvent());
    mocks.selectEventAction.mockRejectedValue(new Error("Failed to fetch"));

    renderWithProvider(<SelectedEventProbe />);
    await screen.findByText("evento: Assembleia de circuito");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Trocar" }));
    });

    expect(lastSelectResult).toEqual({ success: false, error: "Não foi possível trocar o evento." });
    expect(screen.getByText("evento: Assembleia de circuito")).toBeInTheDocument();
  });

  it("acompanha o detalhe do evento: quem altera o evento atualiza a faixa sem saber da seleção", async () => {
    mocks.resolveSelectedEventAction.mockResolvedValue(buildEvent());
    mocks.fetchEvent.mockResolvedValue(buildEvent({ title: "Assembleia com novo horário" }));

    const queryClient = renderWithProvider(<SelectedEventProbe />);
    await screen.findByText("evento: Assembleia de circuito");

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["suoac", "events", "detail", "evt-1"] });
    });

    expect(await screen.findByText("evento: Assembleia com novo horário")).toBeInTheDocument();
    expect(mocks.fetchEvent).toHaveBeenCalledWith("evt-1");
    expect(mocks.resolveSelectedEventAction).toHaveBeenCalledTimes(1);
  });

  it("mantém o evento na tela, sem acender o erro, quando uma atualização em segundo plano falha", async () => {
    mocks.resolveSelectedEventAction.mockResolvedValueOnce(buildEvent());
    mocks.resolveSelectedEventAction.mockRejectedValueOnce(new Error("Network error"));
    mocks.fetchEvent.mockRejectedValue(new Error("Network error"));

    const queryClient = renderWithProvider(<SelectedEventProbe />);
    await screen.findByText("evento: Assembleia de circuito");

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["suoac", "events"] });
    });

    expect(mocks.resolveSelectedEventAction).toHaveBeenCalledTimes(2);
    expect(screen.getByText("evento: Assembleia de circuito")).toBeInTheDocument();
    expect(screen.queryByText("falhou")).not.toBeInTheDocument();
  });

  it("mostra a falha da resolução sem derrubar a árvore e deixa tentar de novo", async () => {
    mocks.resolveSelectedEventAction.mockRejectedValueOnce(new Error("Network error"));
    mocks.resolveSelectedEventAction.mockResolvedValueOnce(buildEvent());

    renderWithProvider(<SelectedEventProbe />);

    expect(await screen.findByText("falhou")).toBeInTheDocument();
    expect(screen.getByText("evento: indefinido")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByText("evento: Assembleia de circuito")).toBeInTheDocument();
  });
});
