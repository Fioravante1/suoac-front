import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  EVENT_DAY_STATUSES,
  EVENT_STATUSES,
  EVENT_TYPES,
  type Event,
  type EventDayInEvent,
  type EventStatus,
} from "@/entities/event";

const mocks = vi.hoisted(() => ({ useSelectedEvent: vi.fn(), useAuthPermissions: vi.fn() }));

vi.mock("@/features/select-event", () => ({ useSelectedEvent: mocks.useSelectedEvent }));
vi.mock("@/shared/auth", () => ({ useAuthPermissions: mocks.useAuthPermissions }));
vi.mock("../event-tabs", () => ({
  EventTabs: ({ eventId, circuitId }: { eventId: string; circuitId: string }) => (
    <nav aria-label="Seções do evento">
      Abas de {eventId} em {circuitId}
    </nav>
  ),
}));
vi.mock("../enroll-passenger-button", () => ({
  EnrollPassengerButton: ({ event }: { event: Event }) => (
    <button type="button">Cadastrar passageiro em {event.title}</button>
  ),
}));

import { EventSummary } from "./event-summary";

function day(date: string): EventDayInEvent {
  return {
    id: `day-${date}`,
    dayNumber: 1,
    date: `${date}T00:00:00.000Z`,
    label: "",
    departureTime: "06:30",
    returnTime: "18:30",
    status: EVENT_DAY_STATUSES.ACTIVE,
    eventId: "event-1",
  };
}

function buildEvent(status: EventStatus): Event {
  return {
    id: "event-1",
    title: "Congresso Regional 2026",
    type: EVENT_TYPES.REGIONAL_CONVENTION,
    ticketPrice: "40.00",
    status,
    registrationDeadline: "2026-10-13T02:59:59.999Z",
    paymentDeadline: "2026-10-20T02:59:59.999Z",
    venue: "Salão de Assembleias",
    address: "Rua das Flores, 100",
    city: "Campinas",
    state: "SP",
    observations: null,
    publishedAt: "2026-09-21T13:04:00.000Z",
    circuitId: "circuit-1",
    createdById: "user-1",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-21T13:04:00.000Z",
    days: [day("2026-10-23"), day("2026-10-24"), day("2026-10-25")],
  };
}

function selectEvent(event: Event | null, { isLoading = false } = {}) {
  mocks.useSelectedEvent.mockReturnValue({
    event,
    isLoading,
    isError: false,
    refetch: vi.fn(),
    isSelecting: false,
    selectEvent: vi.fn(),
  });
}

describe("EventSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // O "hoje" do v3: 16 dias antes do congresso, 5 antes do encerramento.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-07T15:00:00.000Z"));
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra o status, o tipo e o título do evento selecionado", () => {
    selectEvent(buildEvent(EVENT_STATUSES.OPEN));

    render(<EventSummary />);

    const summary = screen.getByRole("region", { name: "Congresso Regional 2026" });

    // O status aparece na pílula e de novo como a etapa atual da linha de etapas.
    const [pill] = within(summary).getAllByText("Inscrições abertas");
    expect(pill).toHaveAttribute("data-tone", "open");
    expect(within(summary).getByText("Congresso regional · 3 dias")).toBeInTheDocument();
    expect(within(summary).getByRole("heading", { level: 2, name: "Congresso Regional 2026" })).toBeInTheDocument();
  });

  it("lista o local, a saída e o retorno, e o valor por dia", () => {
    selectEvent(buildEvent(EVENT_STATUSES.OPEN));

    render(<EventSummary />);

    const facts = within(screen.getByRole("list", { name: "Sobre o evento" })).getAllByRole("listitem");

    expect(facts.map((fact) => fact.textContent)).toEqual([
      "Salão de Assembleias · Campinas, SP",
      "Saída 06:30 · retorno 18:30",
      "R$ 40 por dia",
    ]);
  });

  it("mostra a faixa de datas com a contagem e a linha de etapas", () => {
    selectEvent(buildEvent(EVENT_STATUSES.OPEN));

    render(<EventSummary />);

    expect(screen.getByText("Faltam 16 dias")).toBeInTheDocument();
    expect(screen.getByText("12/10 · em 5 dias")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Etapas do evento" })).toBeInTheDocument();
  });

  it("monta as abas para o evento e o circuito do resumo", () => {
    selectEvent(buildEvent(EVENT_STATUSES.OPEN));

    render(<EventSummary />);

    expect(screen.getByRole("navigation", { name: "Seções do evento" })).toHaveTextContent(
      "Abas de event-1 em circuit-1",
    );
  });

  it("com as inscrições abertas, oferece Encerrar inscrições em breve e Cadastrar passageiro", () => {
    selectEvent(buildEvent(EVENT_STATUSES.OPEN));

    render(<EventSummary />);

    const close = screen.getByRole("button", { name: "Encerrar inscrições" });

    expect(close).toHaveAttribute("aria-disabled", "true");
    expect(close).toHaveAccessibleDescription("Em breve");
    expect(screen.getByRole("button", { name: "Cadastrar passageiro em Congresso Regional 2026" })).toBeInTheDocument();
  });

  it.each([EVENT_STATUSES.CLOSED, EVENT_STATUSES.FINISHED])(
    "sem ações com o evento %s, que não aceita inscrição",
    (status) => {
      selectEvent(buildEvent(status));

      render(<EventSummary />);

      expect(screen.queryByRole("button", { name: /Encerrar inscrições/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Cadastrar passageiro/ })).not.toBeInTheDocument();
      expect(screen.getByRole("list", { name: "Etapas do evento" })).toBeInTheDocument();
    },
  );

  it("para os papéis da congregação, mostra o resumo e as etapas sem as ações e as abas do circuito", () => {
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: false });
    selectEvent(buildEvent(EVENT_STATUSES.OPEN));

    render(<EventSummary />);

    expect(screen.getByRole("heading", { level: 2, name: "Congresso Regional 2026" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Etapas do evento" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Encerrar inscrições/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cadastrar passageiro/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Seções do evento" })).not.toBeInTheDocument();
  });

  it("com o prazo depois do primeiro dia, mantém as ações e a abertura como etapa atual durante o evento", () => {
    vi.setSystemTime(new Date("2026-10-23T15:00:00.000Z"));
    selectEvent({ ...buildEvent(EVENT_STATUSES.OPEN), registrationDeadline: "2026-10-25T02:59:59.999Z" });

    render(<EventSummary />);

    expect(screen.getByRole("button", { name: "Encerrar inscrições" })).toBeInTheDocument();
    expect(screen.getByText("24/10 · amanhã")).toBeInTheDocument();
  });

  it.each([EVENT_STATUSES.DRAFT, EVENT_STATUSES.CANCELLED])(
    "fica de fora com o evento %s, que tem outro resumo",
    (status) => {
      selectEvent(buildEvent(status));

      const { container } = render(<EventSummary />);

      expect(container).toBeEmptyDOMElement();
    },
  );

  it("fica de fora sem evento no circuito", () => {
    selectEvent(null);

    const { container } = render(<EventSummary />);

    expect(container).toBeEmptyDOMElement();
  });

  it("fica de fora fora do shell novo, que é quem monta a seleção", () => {
    mocks.useSelectedEvent.mockReturnValue(null);

    const { container } = render(<EventSummary />);

    expect(container).toBeEmptyDOMElement();
  });

  it("guarda o lugar do resumo enquanto o evento carrega", () => {
    selectEvent(undefined as unknown as null, { isLoading: true });

    render(<EventSummary />);

    expect(screen.getByRole("status", { name: "Carregando o resumo do evento" })).toBeInTheDocument();
  });

  it("avisa quando os dias têm horários diferentes, em vez de mostrar um só", () => {
    const event = buildEvent(EVENT_STATUSES.OPEN);
    const [first, second, third] = event.days ?? [];
    selectEvent({ ...event, days: [first, { ...second, returnTime: "17:00" }, third] });

    render(<EventSummary />);

    expect(screen.getByText("Horários variam por dia")).toBeInTheDocument();
  });
});
