import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_TYPES, EVENT_STATUSES, type Event } from "@/entities/event";

const mocks = vi.hoisted(() => ({
  pathname: "/dashboard",
  isCircuitUser: true,
  selection: { event: null as Event | null | undefined, isError: false, isLoading: false, refetch: vi.fn() },
}));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/features/select-event", () => ({ useSelectedEvent: () => mocks.selection }));
vi.mock("@/shared/auth", () => ({ useAuthPermissions: () => ({ isCircuitUser: mocks.isCircuitUser }) }));
vi.mock("../panel-empty-state", () => ({ PanelEmptyState: () => <p>Sem evento</p> }));
vi.mock("../panel-draft-state", () => ({ PanelDraftState: () => <p>Painel do rascunho</p> }));
vi.mock("../panel-cancelled-state", () => ({ PanelCancelledState: () => <p>Painel cancelado</p> }));
import { PanelEventState } from "./panel-event-state";

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

describe("PanelEventState", () => {
  beforeEach(() => {
    mocks.pathname = "/dashboard";
    mocks.isCircuitUser = true;
    mocks.selection = { event: null, isError: false, isLoading: false, refetch: vi.fn() };
  });

  it("substitui o dashboard sem evento", () => {
    render(<PanelEventState>Visão geral</PanelEventState>);
    expect(screen.getByText("Sem evento")).toBeInTheDocument();
    expect(screen.queryByText("Visão geral")).not.toBeInTheDocument();
  });

  it.each([
    [EVENT_STATUSES.DRAFT, "Painel do rascunho"],
    [EVENT_STATUSES.CANCELLED, "Painel cancelado"],
  ] as const)("renderiza %s", (status, label) => {
    mocks.selection.event = { ...event, status };
    render(<PanelEventState>Visão geral</PanelEventState>);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("preserva conteúdo em outra rota", () => {
    mocks.pathname = "/events";
    mocks.selection.event = event;
    render(<PanelEventState>Eventos</PanelEventState>);
    expect(screen.getByText("Eventos")).toBeInTheDocument();
  });

  it("preserva o dashboard publicado", () => {
    mocks.selection.event = { ...event, status: EVENT_STATUSES.OPEN };
    render(<PanelEventState>Visão geral</PanelEventState>);
    expect(screen.getByText("Visão geral")).toBeInTheDocument();
  });

  it.each([null, EVENT_STATUSES.DRAFT])(
    "trata %s como sem evento para congregação, sem exibir erro ou rascunho",
    (status) => {
      mocks.isCircuitUser = false;
      mocks.selection.event = status ? { ...event, status } : null;
      render(<PanelEventState>Dashboard da congregação sem evento</PanelEventState>);
      expect(screen.queryByText("Painel do rascunho")).not.toBeInTheDocument();
      expect(screen.queryByText("Nenhum evento ativo")).not.toBeInTheDocument();
      expect(screen.getByText("Dashboard da congregação sem evento")).toBeInTheDocument();
    },
  );

  it("põe o estado alternativo no contêiner do shell e deixa o conteúdo da página sem ele", () => {
    const { container, rerender } = render(<PanelEventState className="content">Visão geral</PanelEventState>);
    expect(container.querySelector(".content")).toContainElement(screen.getByText("Sem evento"));

    mocks.selection.event = { ...event, status: EVENT_STATUSES.OPEN };
    rerender(<PanelEventState className="content">Visão geral</PanelEventState>);
    expect(screen.getByText("Visão geral")).toBeInTheDocument();
    expect(container.querySelector(".content")).toBeNull();
  });

  it("permite tentar de novo após erro de seleção", () => {
    mocks.selection.isError = true;
    render(<PanelEventState>Visão geral</PanelEventState>);
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(mocks.selection.refetch).toHaveBeenCalled();
  });
});
