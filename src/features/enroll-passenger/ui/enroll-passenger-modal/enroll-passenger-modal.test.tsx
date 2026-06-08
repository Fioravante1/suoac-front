import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EVENT_DAY_STATUSES, EVENT_STATUSES, EVENT_TYPES, type Event } from "@/entities/event";

import { EnrollPassengerModal } from "./enroll-passenger-modal";

vi.mock("@/shared/api", () => ({
  useQuery: () => ({
    data: {
      data: [
        { id: "p-1", name: "João Silva", rg: "12345678X", phone: "11999999999" },
        { id: "p-2", name: "Maria Souza", rg: "98765432X", phone: null },
      ],
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    },
    isLoading: false,
  }),
  queryKeys: {
    passengers: {
      list: () => ["passengers", "list"],
    },
  },
}));

vi.mock("@/entities/passenger", () => ({
  passengerListOptions: () => ({
    queryKey: ["passengers", "list"],
    queryFn: vi.fn(),
    enabled: true,
  }),
}));

const baseEvent: Event = {
  id: "event-1",
  title: "Congresso Regional 2026",
  type: EVENT_TYPES.REGIONAL_CONVENTION,
  ticketPrice: "75.00",
  status: EVENT_STATUSES.OPEN,
  registrationDeadline: "2026-06-15T00:00:00.000Z",
  paymentDeadline: "2026-07-01T00:00:00.000Z",
  venue: "Salão Central",
  address: "Rua das Flores, 100",
  city: "São Paulo",
  state: "SP",
  observations: null,
  circuitId: "circuit-1",
  createdById: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
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
      returnTime: "18:00",
      status: EVENT_DAY_STATUSES.ACTIVE,
      eventId: "event-1",
    },
  ],
};

describe("EnrollPassengerModal", () => {
  it("renderiza o título do modal", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    expect(screen.getByText("Inscrever passageiro")).toBeInTheDocument();
  });

  it("renderiza as duas abas", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    expect(screen.getByText("Passageiro existente")).toBeInTheDocument();
    expect(screen.getByText("Novo passageiro")).toBeInTheDocument();
  });

  it("mostra checkboxes de dias para congresso regional", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    expect(screen.getByText("Dia 1 - Sexta-feira")).toBeInTheDocument();
    expect(screen.getByText("Dia 2 - Sábado")).toBeInTheDocument();
  });

  it("não mostra checkboxes de dias para assembleia", () => {
    const assemblyEvent: Event = { ...baseEvent, type: EVENT_TYPES.ASSEMBLY };

    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={assemblyEvent} congregationId="cong-1" />,
    );

    expect(screen.queryByText("Dias do evento")).not.toBeInTheDocument();
  });

  it("exibe dica de busca quando campo de pesquisa está vazio", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    expect(screen.getByText("Digite ao menos 2 caracteres para buscar passageiros.")).toBeInTheDocument();
    expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
  });

  it("exibe lista de passageiros ao buscar", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    fireEvent.change(screen.getByLabelText("Buscar passageiro"), { target: { value: "João" } });

    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
  });

  it("mostra campos de novo passageiro ao trocar aba", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    fireEvent.click(screen.getByText("Novo passageiro"));

    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByLabelText("RG")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone (opcional)")).toBeInTheDocument();
  });

  it("fecha ao clicar em cancelar", () => {
    const onClose = vi.fn();

    render(
      <EnrollPassengerModal open onClose={onClose} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("exibe campo de isenção ao marcar checkbox", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    fireEvent.click(screen.getByLabelText("Isento de pagamento"));

    expect(screen.getByLabelText("Motivo da isenção")).toBeInTheDocument();
  });

  it("exibe campos de pagamento ao marcar checkbox", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    fireEvent.click(screen.getByLabelText("Registrar pagamento agora?"));

    expect(screen.getByLabelText("Valor (R$)")).toBeInTheDocument();
    expect(screen.getByLabelText("Data do pagamento")).toBeInTheDocument();
    expect(screen.getByLabelText("Observações do pagamento (opcional)")).toBeInTheDocument();
  });

  it("esconde campos de pagamento quando checkbox está desmarcado", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    expect(screen.queryByLabelText("Valor (R$)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Data do pagamento")).not.toBeInTheDocument();
  });

  it("desmarca isenção ao marcar pagamento (exclusão mútua)", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    fireEvent.click(screen.getByLabelText("Isento de pagamento"));
    expect(screen.getByLabelText("Motivo da isenção")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Registrar pagamento agora?"));

    expect(screen.queryByLabelText("Motivo da isenção")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Valor (R$)")).toBeInTheDocument();
  });

  it("desmarca pagamento ao marcar isenção (exclusão mútua)", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    fireEvent.click(screen.getByLabelText("Registrar pagamento agora?"));
    expect(screen.getByLabelText("Valor (R$)")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Isento de pagamento"));

    expect(screen.queryByLabelText("Valor (R$)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Motivo da isenção")).toBeInTheDocument();
  });

  it("mostra valor total estimado quando há dias selecionados", () => {
    render(
      <EnrollPassengerModal open onClose={vi.fn()} onSubmit={vi.fn()} event={baseEvent} congregationId="cong-1" />,
    );

    fireEvent.click(screen.getByText("Dia 1 - Sexta-feira"));
    fireEvent.click(screen.getByText("Dia 2 - Sábado"));
    fireEvent.click(screen.getByLabelText("Registrar pagamento agora?"));

    expect(screen.getByText(/Valor total estimado/)).toBeInTheDocument();
  });
});
