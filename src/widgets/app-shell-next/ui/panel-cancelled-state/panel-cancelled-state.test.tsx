import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_TYPES, EVENT_STATUSES, type Event } from "@/entities/event";

const mocks = vi.hoisted(() => ({ query: vi.fn(), retry: vi.fn() }));
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  useQuery: mocks.query,
}));
import { PanelCancelledState } from "./panel-cancelled-state";

const event: Event = {
  id: "e1",
  title: "Assembleia 2027",
  type: EVENT_TYPES.ASSEMBLY,
  status: EVENT_STATUSES.DRAFT,
  ticketPrice: "40",
  venue: "Salão",
  city: "Campinas",
  state: "SP",
  address: "Rua A",
  registrationDeadline: "2027-10-13T02:59:59.999Z",
  paymentDeadline: "2027-10-20T02:59:59.999Z",
  circuitId: "c1",
  createdById: "u1",
  observations: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  days: [],
};

describe("PanelCancelledState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockReturnValue({
      isPending: false,
      isSuccess: true,
      data: {
        totals: { totalPassengers: 2, totalReceived: "80", byStatus: { paid: 1, partial: 1, pending: 0, exempt: 0 } },
        congregations: [
          { congregationId: "g1", congregationName: "Jardim Paulista", totalPassengers: 2, totalReceived: "80" },
        ],
      },
    });
  });

  it("mostra dados reais e não inventa devoluções ou notificações", () => {
    render(
      <PanelCancelledState
        event={{
          ...event,
          status: EVENT_STATUSES.CANCELLED,
          cancelledAt: "2026-10-09T01:00:00Z",
          cancelledBy: { id: "u1", name: "Marcos" },
        }}
      />,
    );
    expect(screen.getByText("Evento cancelado em 08/10")).toBeInTheDocument();
    expect(screen.getByText("Cancelado em 08/10 por Marcos")).toBeInTheDocument();
    expect(screen.getByText("Jardim Paulista")).toBeInTheDocument();
    expect(screen.getByText("Controle de devoluções em breve")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.queryByText(/foram avisadas/)).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar lista" })).toHaveAttribute("aria-disabled", "true");
  });

  it("explica a ausência de congregações", () => {
    mocks.query.mockReturnValue({ isSuccess: true, data: { congregations: [] } });
    render(<PanelCancelledState event={event} />);
    expect(screen.getByText("Nenhuma congregação com pagamentos registrados.")).toBeInTheDocument();
  });

  it("permite recuperar uma falha financeira", () => {
    mocks.query.mockReturnValue({ isError: true, refetch: mocks.retry });
    render(<PanelCancelledState event={event} />);
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(mocks.retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar");
  });
  it("concorda passageiros e congregações no singular", () => {
    mocks.query.mockReturnValue({
      isSuccess: true,
      data: {
        totals: { totalPassengers: 1, totalReceived: "40", byStatus: { paid: 1, partial: 0 } },
        congregations: [{ congregationId: "g1", congregationName: "Central", totalPassengers: 1, totalReceived: "40" }],
      },
    });
    render(<PanelCancelledState event={event} />);
    expect(screen.getByText("em 1 congregação")).toBeInTheDocument();
    expect(screen.getByText("1 passageiro · R$ 40")).toBeInTheDocument();
  });
});
