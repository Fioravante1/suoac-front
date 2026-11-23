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

const mocks = vi.hoisted(() => ({ useSelectedEvent: vi.fn(), usePathname: vi.fn(), useAuthPermissions: vi.fn() }));

vi.mock("@/features/select-event", () => ({ useSelectedEvent: mocks.useSelectedEvent }));
vi.mock("@/shared/auth", () => ({ useAuthPermissions: mocks.useAuthPermissions }));
vi.mock("next/navigation", () => ({ usePathname: mocks.usePathname }));

import { EventHomeHero } from "./event-home-hero";

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
  mocks.useSelectedEvent.mockReturnValue({ event, isLoading, isError: false });
}

function hero() {
  return screen.getByRole("region", { name: "Resumo de Congresso Regional 2026" });
}

describe("EventHomeHero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-07T15:00:00.000Z"));
    mocks.usePathname.mockReturnValue("/dashboard");
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra os dias, a contagem regressiva e o local, sem a UF", () => {
    selectEvent(buildEvent(EVENT_STATUSES.OPEN));

    render(<EventHomeHero />);

    expect(within(hero()).getByRole("list", { name: "Dias do evento" })).toBeInTheDocument();
    expect(within(hero()).getByText("Faltam 16 dias")).toBeInTheDocument();
    expect(within(hero()).getByText("Salão de Assembleias · Campinas")).toBeInTheDocument();
  });

  it("mostra a linha de etapas com os rótulos curtos do celular", () => {
    selectEvent(buildEvent(EVENT_STATUSES.OPEN));

    render(<EventHomeHero />);

    const steps = within(within(hero()).getByRole("list", { name: "Etapas do evento" })).getAllByRole("listitem");

    expect(steps.map((step) => step.textContent)).toEqual([
      "Abertas (etapa atual)desde 21/09",
      "Encerram (a seguir)12/10 · 5 dias",
      "Evento (a seguir)23 a 25/10",
      "Finalizado (a seguir)após 25/10",
    ]);
  });

  it("com as inscrições abertas, oferece Encerrar inscrições em breve e Ver inscritos", () => {
    selectEvent(buildEvent(EVENT_STATUSES.OPEN));

    render(<EventHomeHero />);

    expect(screen.getByRole("button", { name: "Encerrar inscrições" })).toHaveAccessibleDescription("Em breve");
    expect(screen.getByRole("link", { name: "Ver inscritos" })).toHaveAttribute("href", "/events/event-1#inscricoes");
  });

  it.each([EVENT_STATUSES.CLOSED, EVENT_STATUSES.FINISHED])("com o evento %s, só oferece Ver inscritos", (status) => {
    selectEvent(buildEvent(status));

    render(<EventHomeHero />);

    expect(screen.queryByRole("button", { name: "Encerrar inscrições" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver inscritos" })).toBeInTheDocument();
  });

  it("deixa o mês no lugar da contagem no dia do evento", () => {
    vi.setSystemTime(new Date("2026-10-23T15:00:00.000Z"));
    selectEvent(buildEvent(EVENT_STATUSES.CLOSED));

    render(<EventHomeHero />);

    expect(screen.queryByText(/Faltam/)).not.toBeInTheDocument();
    expect(within(hero()).getByText("outubro de 2026")).toBeInTheDocument();
  });

  it("para os papéis da congregação, deixa de fora Encerrar inscrições, que é do circuito", () => {
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: false });
    selectEvent(buildEvent(EVENT_STATUSES.OPEN));

    render(<EventHomeHero />);

    expect(screen.queryByRole("button", { name: "Encerrar inscrições" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver inscritos" })).toBeInTheDocument();
  });

  it("guarda o lugar do hero no Início enquanto o evento carrega", () => {
    selectEvent(null, { isLoading: true });

    render(<EventHomeHero />);

    expect(screen.getByRole("status", { name: "Carregando o resumo do evento" })).toBeInTheDocument();
  });

  it("não guarda lugar fora do Início, nem carregando", () => {
    mocks.usePathname.mockReturnValue("/financial");
    selectEvent(null, { isLoading: true });

    const { container } = render(<EventHomeHero />);

    expect(container).toBeEmptyDOMElement();
  });

  it("só aparece no Início", () => {
    mocks.usePathname.mockReturnValue("/passengers");
    selectEvent(buildEvent(EVENT_STATUSES.OPEN));

    const { container } = render(<EventHomeHero />);

    expect(container).toBeEmptyDOMElement();
  });

  it.each([EVENT_STATUSES.DRAFT, EVENT_STATUSES.CANCELLED])(
    "fica de fora com o evento %s, que tem outro resumo",
    (status) => {
      selectEvent(buildEvent(status));

      const { container } = render(<EventHomeHero />);

      expect(container).toBeEmptyDOMElement();
    },
  );

  it("fica de fora sem evento e fora do shell novo", () => {
    selectEvent(null);
    const { container, rerender } = render(<EventHomeHero />);

    expect(container).toBeEmptyDOMElement();

    mocks.useSelectedEvent.mockReturnValue(null);
    rerender(<EventHomeHero />);

    expect(container).toBeEmptyDOMElement();
  });
});
