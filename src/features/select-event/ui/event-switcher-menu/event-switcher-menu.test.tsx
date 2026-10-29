import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventSwitcherItem, EventSwitcherState } from "../../model";

const mocks = vi.hoisted(() => ({ useEventSwitcher: vi.fn() }));

vi.mock("../../model", () => ({ useEventSwitcher: mocks.useEventSwitcher }));

import { EventSwitcherMenu } from "./event-switcher-menu";

const congress: EventSwitcherItem = {
  id: "evt-congresso",
  title: "Congresso Regional 2026",
  period: "23–25 out",
  statusLabel: "Inscrições abertas",
  statusVariant: "success",
  meta: "23–25 out · Inscrições abertas",
  isSelected: true,
};

const draft: EventSwitcherItem = {
  id: "evt-rascunho",
  title: "Assembleia de Circuito",
  period: "14 nov",
  statusLabel: "Rascunho",
  statusVariant: "neutral",
  meta: "14 nov · Rascunho",
  isSelected: false,
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
    events: [draft, congress, finished],
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

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: /Congresso Regional 2026/ }));

  return screen.getByRole("menu", { name: "Eventos do circuito" });
}

describe("EventSwitcherMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra no botão o evento selecionado e o período, com o menu fechado", () => {
    mockSwitcher();

    render(<EventSwitcherMenu />);

    const trigger = screen.getByRole("button", { name: /Congresso Regional 2026/ });
    expect(trigger).toHaveTextContent("23–25 out");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(mocks.useEventSwitcher).toHaveBeenLastCalledWith({ isOpen: false });
  });

  it("circuito sem evento atual mostra 'Nenhum evento ativo', com o ponto neutro da faixa", () => {
    mockSwitcher({ current: null, editEventHref: null });

    const { container } = render(<EventSwitcherMenu />);

    expect(screen.getByRole("button", { name: /Nenhum evento ativo/ })).toBeInTheDocument();
    expect(container.querySelector('[data-variant="neutral"]')).toHaveAttribute("data-surface", "navy");
  });

  it("com a troca a caminho, o botão mostra o carregamento", () => {
    mockSwitcher({ isSelecting: true });

    render(<EventSwitcherMenu />);

    const trigger = screen.getByRole("button", { name: /Congresso Regional 2026/ });
    expect(trigger).toHaveAttribute("aria-busy", "true");
    expect(within(trigger).getByRole("status", { name: "Carregando" })).toBeInTheDocument();
  });

  it("abre com os eventos do circuito, período e status, e o selecionado marcado", () => {
    mockSwitcher();

    render(<EventSwitcherMenu />);
    const menu = openMenu();

    const items = within(menu).getAllByRole("menuitemradio");
    expect(items.map((item) => item.textContent)).toEqual([
      "Assembleia de Circuito14 nov · Rascunho",
      "Congresso Regional 202623–25 out · Inscrições abertas",
      "Assembleia com Representante15 mar · Finalizado",
    ]);
    expect(within(menu).getByRole("menuitemradio", { name: /Congresso Regional 2026/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(mocks.useEventSwitcher).toHaveBeenLastCalledWith({ isOpen: true });
  });

  it("ao abrir, o foco vai para o evento selecionado", () => {
    mockSwitcher();

    render(<EventSwitcherMenu />);
    openMenu();

    expect(screen.getByRole("menuitemradio", { name: /Congresso Regional 2026/ })).toHaveFocus();
  });

  it("abrindo antes de a lista chegar, o foco espera no menu e desce para o evento selecionado", () => {
    mockSwitcher({ events: [], isLoadingEvents: true });

    const { rerender } = render(<EventSwitcherMenu />);
    const menu = openMenu();

    expect(menu).toHaveFocus();

    mockSwitcher();
    rerender(<EventSwitcherMenu />);

    expect(screen.getByRole("menuitemradio", { name: /Congresso Regional 2026/ })).toHaveFocus();
  });

  it("trocar de evento fecha o menu, devolve o foco ao botão e troca o evento do shell", () => {
    const switcher = mockSwitcher();

    render(<EventSwitcherMenu />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitemradio", { name: /Assembleia de Circuito/ }));

    expect(switcher.selectEvent).toHaveBeenCalledWith("evt-rascunho");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Congresso Regional 2026/ })).toHaveFocus();
  });

  it("as setas andam entre os itens e dão a volta nas pontas", () => {
    mockSwitcher();

    render(<EventSwitcherMenu />);
    const menu = openMenu();

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(screen.getByRole("menuitemradio", { name: /Assembleia com Representante/ })).toHaveFocus();

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(screen.getByRole("menuitem", { name: "Criar novo evento" })).toHaveFocus();

    fireEvent.keyDown(menu, { key: "End" });
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(screen.getByRole("menuitemradio", { name: /Assembleia de Circuito/ })).toHaveFocus();
  });

  it("a seta para baixo no botão abre o menu", () => {
    mockSwitcher();

    render(<EventSwitcherMenu />);
    fireEvent.keyDown(screen.getByRole("button", { name: /Congresso Regional 2026/ }), { key: "ArrowDown" });

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /Congresso Regional 2026/ })).toHaveFocus();
  });

  it("a seta para cima no botão abre o menu pelo último item", () => {
    mockSwitcher();

    render(<EventSwitcherMenu />);
    fireEvent.keyDown(screen.getByRole("button", { name: /Congresso Regional 2026/ }), { key: "ArrowUp" });

    expect(screen.getByRole("menuitem", { name: "Editar evento atual" })).toHaveFocus();
  });

  it("Esc fecha e devolve o foco ao botão", () => {
    mockSwitcher();

    render(<EventSwitcherMenu />);
    const menu = openMenu();
    fireEvent.keyDown(menu, { key: "Escape" });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Congresso Regional 2026/ })).toHaveFocus();
  });

  it("clicar fora fecha o menu", () => {
    mockSwitcher();

    render(
      <>
        <EventSwitcherMenu />
        <p>fora do menu</p>
      </>,
    );
    openMenu();
    fireEvent.pointerDown(screen.getByText("fora do menu"));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Espaço ativa os links do menu, como Enter", () => {
    mockSwitcher();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<EventSwitcherMenu />);
    const menu = openMenu();
    const create = screen.getByRole("menuitem", { name: "Criar novo evento" });
    create.focus();
    fireEvent.keyDown(menu, { key: " " });

    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it("criar e editar levam às telas de eventos", () => {
    mockSwitcher();

    render(<EventSwitcherMenu />);
    openMenu();

    expect(screen.getByRole("menuitem", { name: "Criar novo evento" })).toHaveAttribute("href", "/events");
    expect(screen.getByRole("menuitem", { name: "Editar evento atual" })).toHaveAttribute(
      "href",
      "/events/evt-congresso",
    );
  });

  it("sem permissão para criar nem editar, o menu só lista os eventos", () => {
    mockSwitcher({ createEventHref: null, editEventHref: null });

    render(<EventSwitcherMenu />);
    openMenu();

    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("mostra o carregamento da lista dentro do menu", () => {
    mockSwitcher({ events: [], isLoadingEvents: true });

    render(<EventSwitcherMenu />);
    const menu = openMenu();

    expect(menu).toHaveAttribute("aria-busy", "true");
    expect(within(menu).queryByRole("menuitemradio")).not.toBeInTheDocument();
  });

  it("falha ao carregar a lista mostra o erro dentro do menu, que continua aberto, e tenta de novo", () => {
    const switcher = mockSwitcher({ events: [], isEventsError: true });

    render(<EventSwitcherMenu />);
    const menu = openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Tentar de novo" }));

    expect(menu).toHaveAccessibleDescription(
      "Não foi possível carregar os eventos. Verifique sua conexão e tente de novo.",
    );
    expect(switcher.retryEvents).toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("circuito sem eventos diz isso, orienta a criar o primeiro e mantém a ação de criar", () => {
    mockSwitcher({ current: null, events: [], editEventHref: null });

    render(<EventSwitcherMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Nenhum evento ativo/ }));

    expect(screen.getByRole("menu")).toHaveAccessibleDescription(
      "Nenhum evento no circuito ainda. Crie o primeiro evento para começar as inscrições.",
    );
    expect(screen.getByRole("menuitem", { name: "Criar novo evento" })).toBeInTheDocument();
  });

  it("papel sem permissão de criar, num circuito sem eventos, fica sabendo que eles aparecem ali", () => {
    mockSwitcher({ current: null, events: [], createEventHref: null, editEventHref: null });

    render(<EventSwitcherMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Nenhum evento ativo/ }));

    expect(screen.getByText("Quando o circuito criar um evento, ele aparece aqui.")).toBeInTheDocument();
  });

  it("busca a lista antes de abrir, quando o ponteiro ou o foco chegam ao botão", () => {
    const switcher = mockSwitcher();

    render(<EventSwitcherMenu />);
    const trigger = screen.getByRole("button", { name: /Congresso Regional 2026/ });
    fireEvent.pointerEnter(trigger);
    fireEvent.focus(trigger);

    expect(switcher.prefetchEvents).toHaveBeenCalledTimes(2);
  });
});
