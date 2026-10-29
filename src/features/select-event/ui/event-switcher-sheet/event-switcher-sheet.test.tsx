import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventSwitcherItem, EventSwitcherState } from "../../model";

const mocks = vi.hoisted(() => ({ useEventSwitcher: vi.fn() }));

vi.mock("../../model", () => ({ useEventSwitcher: mocks.useEventSwitcher }));

import { EventSwitcherSheet } from "./event-switcher-sheet";

const congress: EventSwitcherItem = {
  id: "evt-congresso",
  title: "Congresso Regional 2026",
  period: "23–25 out",
  statusLabel: "Inscrições abertas",
  statusVariant: "success",
  meta: "23–25 out · Inscrições abertas",
  isSelected: true,
};

const finished: EventSwitcherItem = {
  id: "evt-finalizado",
  title: "Assembleia com Representante",
  period: "15 mar",
  statusLabel: "Finalizado",
  statusVariant: "info",
  meta: "15 mar · Finalizado",
  isSelected: false,
};

function mockSwitcher(overrides: Partial<EventSwitcherState> = {}): EventSwitcherState {
  const state: EventSwitcherState = {
    current: congress,
    isCurrentLoading: false,
    events: [congress, finished],
    isLoadingEvents: false,
    isEventsError: false,
    retryEvents: vi.fn(),
    prefetchEvents: vi.fn(),
    isSelecting: false,
    selectEvent: vi.fn(),
    createEventHref: "/events",
    editEventHref: "/events/evt-congresso",
    ...overrides,
  };
  mocks.useEventSwitcher.mockReturnValue(state);

  return state;
}

describe("EventSwitcherSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fechada, não mostra nada nem busca a lista", () => {
    mockSwitcher();

    render(<EventSwitcherSheet open={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.useEventSwitcher).toHaveBeenLastCalledWith({ isOpen: false });
  });

  it("aberta, lista os eventos do circuito com período e status, e marca o selecionado", () => {
    mockSwitcher();

    render(<EventSwitcherSheet open onClose={vi.fn()} />);

    const sheet = screen.getByRole("dialog", { name: "Eventos do circuito" });
    expect(within(sheet).getByRole("button", { name: /Congresso Regional 2026/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(within(sheet).getByRole("button", { name: /Assembleia com Representante/ })).toHaveTextContent(
      "15 mar · Finalizado",
    );
    expect(mocks.useEventSwitcher).toHaveBeenLastCalledWith({ isOpen: true });
  });

  it("escolher um evento fecha a sheet e troca o evento do shell", () => {
    const switcher = mockSwitcher();
    const onClose = vi.fn();

    render(<EventSwitcherSheet open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Assembleia com Representante/ }));

    expect(onClose).toHaveBeenCalled();
    expect(switcher.selectEvent).toHaveBeenCalledWith("evt-finalizado");
  });

  it("criar novo evento leva à tela de eventos e fecha a sheet", () => {
    mockSwitcher();
    const onClose = vi.fn();

    render(<EventSwitcherSheet open onClose={onClose} />);
    const create = screen.getByRole("link", { name: "Criar novo evento" });
    fireEvent.click(create);

    expect(create).toHaveAttribute("href", "/events");
    expect(onClose).toHaveBeenCalled();
  });

  it("papel sem permissão de criar não vê a ação", () => {
    mockSwitcher({ createEventHref: null, editEventHref: null });

    render(<EventSwitcherSheet open onClose={vi.fn()} />);

    expect(screen.queryByRole("link", { name: "Criar novo evento" })).not.toBeInTheDocument();
  });

  it("mostra o carregamento da lista", () => {
    mockSwitcher({ events: [], isLoadingEvents: true });

    render(<EventSwitcherSheet open onClose={vi.fn()} />);

    expect(screen.getByRole("status", { name: "Carregando eventos" })).toBeInTheDocument();
  });

  it("falha ao carregar a lista mostra o erro e tenta de novo, sem fechar a sheet", () => {
    const switcher = mockSwitcher({ events: [], isEventsError: true });
    const onClose = vi.fn();

    render(<EventSwitcherSheet open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar os eventos.");
    expect(switcher.retryEvents).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("circuito sem eventos diz isso, orienta a criar o primeiro e mantém a ação de criar", () => {
    mockSwitcher({ current: null, events: [], editEventHref: null });

    render(<EventSwitcherSheet open onClose={vi.fn()} />);

    expect(screen.getByText("Nenhum evento no circuito ainda.")).toBeInTheDocument();
    expect(screen.getByText("Crie o primeiro evento para começar as inscrições.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar novo evento" })).toBeInTheDocument();
  });

  it("papel sem permissão de criar, num circuito sem eventos, fica sabendo que eles aparecem ali", () => {
    mockSwitcher({ current: null, events: [], createEventHref: null, editEventHref: null });

    render(<EventSwitcherSheet open onClose={vi.fn()} />);

    expect(screen.getByText("Quando o circuito criar um evento, ele aparece aqui.")).toBeInTheDocument();
  });
});
