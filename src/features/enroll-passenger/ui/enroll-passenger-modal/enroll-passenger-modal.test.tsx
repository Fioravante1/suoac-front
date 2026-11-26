import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_DAY_STATUSES, EVENT_STATUSES, EVENT_TYPES, type Event } from "@/entities/event";

import { EnrollPassengerModal } from "./enroll-passenger-modal";

interface QueryOptions {
  queryKey: readonly string[];
  enabled?: boolean;
}

function page<TItem>(data: TItem[]) {
  return { data, meta: { total: data.length, page: 1, limit: 20, totalPages: 1 } };
}

// Cada consulta do modal responde pela chave; desligada, não traz dado, como o TanStack Query.
const QUERY_DATA: Record<string, unknown> = {
  "passengers/congregation": page([
    { id: "p-1", name: "João Silva", rg: "12345678X", phone: "11999999999" },
    { id: "p-2", name: "Maria Souza", rg: "98765432X", phone: null },
  ]),
  "passengers/circuit": page([
    { id: "p-3", name: "João Pereira", rg: "11122233X", phone: null, congregationName: "Congregação Norte" },
  ]),
  "congregations/select": page([
    { id: "cong-1", name: "Congregação Centro" },
    { id: "cong-2", name: "Congregação Norte" },
  ]),
};

const mocks = vi.hoisted(() => ({ failingQueries: new Set<string>(), refetch: vi.fn() }));

vi.mock("@/shared/api", () => ({
  useQuery: ({ queryKey, enabled = true }: QueryOptions) => {
    const key = queryKey.join("/");
    const isError = enabled && mocks.failingQueries.has(key);

    return {
      data: enabled && !isError ? QUERY_DATA[key] : undefined,
      isLoading: false,
      isError,
      refetch: mocks.refetch,
    };
  },
}));

vi.mock("@/entities/passenger", () => ({
  passengerListOptions: () => ({ queryKey: ["passengers", "congregation"], enabled: true }),
  passengerListByCircuitOptions: () => ({ queryKey: ["passengers", "circuit"], enabled: true }),
}));

vi.mock("@/entities/congregation", () => ({
  congregationSelectOptions: () => ({ queryKey: ["congregations", "select"], enabled: true }),
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
  beforeEach(() => {
    mocks.failingQueries.clear();
    mocks.refetch.mockReset();
  });

  it("renderiza o título do modal", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    expect(screen.getByText("Inscrever passageiro")).toBeInTheDocument();
  });

  it("renderiza as duas abas", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    expect(screen.getByText("Passageiro existente")).toBeInTheDocument();
    expect(screen.getByText("Novo passageiro")).toBeInTheDocument();
  });

  it("mostra checkboxes de dias para congresso regional", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    expect(screen.getByText("Dia 1 - Sexta-feira")).toBeInTheDocument();
    expect(screen.getByText("Dia 2 - Sábado")).toBeInTheDocument();
  });

  it("não mostra checkboxes de dias para assembleia", () => {
    const assemblyEvent: Event = { ...baseEvent, type: EVENT_TYPES.ASSEMBLY, days: baseEvent.days?.slice(0, 1) };

    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={assemblyEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    expect(screen.queryByText("Dias do evento")).not.toBeInTheDocument();
  });

  it("mostra checkboxes de dias para o tipo Outro com mais de um dia", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={{ ...baseEvent, type: EVENT_TYPES.OTHER }}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    expect(screen.getByText("Dias do evento")).toBeInTheDocument();
  });

  it.each([EVENT_TYPES.OTHER, EVENT_TYPES.REGIONAL_CONVENTION])(
    "não mostra checkboxes de dias quando o evento do tipo %s tem um só dia ativo",
    (type) => {
      render(
        <EnrollPassengerModal
          open
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          event={{ ...baseEvent, type, days: baseEvent.days?.slice(0, 1) }}
          isCircuitUser={false}
          congregationId="cong-1"
        />,
      );

      expect(screen.queryByText("Dias do evento")).not.toBeInTheDocument();
    },
  );

  it("exibe dica de busca quando campo de pesquisa está vazio", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    expect(screen.getByText("Digite ao menos 2 caracteres para buscar passageiros.")).toBeInTheDocument();
    expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
  });

  it("exibe lista de passageiros ao buscar", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    fireEvent.change(screen.getByLabelText("Buscar passageiro"), { target: { value: "João" } });

    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
  });

  it("mostra campos de novo passageiro ao trocar aba", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    fireEvent.click(screen.getByText("Novo passageiro"));

    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByLabelText("RG")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone (opcional)")).toBeInTheDocument();
  });

  it("fecha ao clicar em cancelar", () => {
    const onClose = vi.fn();

    render(
      <EnrollPassengerModal
        open
        onClose={onClose}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("exibe campo de isenção ao marcar checkbox", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    fireEvent.click(screen.getByLabelText("Isento de pagamento"));

    expect(screen.getByLabelText("Motivo da isenção")).toBeInTheDocument();
  });

  it("exibe campos de pagamento ao marcar checkbox", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    fireEvent.click(screen.getByLabelText("Registrar pagamento agora?"));

    expect(screen.getByLabelText("Valor (R$)")).toBeInTheDocument();
    expect(screen.getByLabelText("Data do pagamento")).toBeInTheDocument();
    expect(screen.getByLabelText("Observações do pagamento (opcional)")).toBeInTheDocument();
  });

  it("esconde campos de pagamento quando checkbox está desmarcado", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    expect(screen.queryByLabelText("Valor (R$)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Data do pagamento")).not.toBeInTheDocument();
  });

  it("desmarca isenção ao marcar pagamento (exclusão mútua)", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    fireEvent.click(screen.getByLabelText("Isento de pagamento"));
    expect(screen.getByLabelText("Motivo da isenção")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Registrar pagamento agora?"));

    expect(screen.queryByLabelText("Motivo da isenção")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Valor (R$)")).toBeInTheDocument();
  });

  it("desmarca pagamento ao marcar isenção (exclusão mútua)", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    fireEvent.click(screen.getByLabelText("Registrar pagamento agora?"));
    expect(screen.getByLabelText("Valor (R$)")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Isento de pagamento"));

    expect(screen.queryByLabelText("Valor (R$)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Motivo da isenção")).toBeInTheDocument();
  });

  it("mostra valor total estimado quando há dias selecionados", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    fireEvent.click(screen.getByText("Dia 1 - Sexta-feira"));
    fireEvent.click(screen.getByText("Dia 2 - Sábado"));
    fireEvent.click(screen.getByLabelText("Registrar pagamento agora?"));

    expect(screen.getByText(/Valor total estimado/)).toBeInTheDocument();
  });

  describe("para os papéis do circuito", () => {
    it("busca no circuito do evento e mostra a congregação de cada passageiro", () => {
      render(
        <EnrollPassengerModal
          open
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          event={baseEvent}
          isCircuitUser
          congregationId=""
        />,
      );

      fireEvent.change(screen.getByLabelText("Buscar passageiro"), { target: { value: "João" } });

      expect(screen.getByText("João Pereira")).toBeInTheDocument();
      expect(screen.getByText("RG: 11122233X · Congregação Norte")).toBeInTheDocument();
      expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
    });

    it("pede a congregação do passageiro novo e a envia na inscrição", async () => {
      const onSubmit = vi.fn().mockResolvedValue({ success: true, data: {} });
      const assemblyEvent: Event = { ...baseEvent, type: EVENT_TYPES.ASSEMBLY };

      render(
        <EnrollPassengerModal
          open
          onClose={vi.fn()}
          onSubmit={onSubmit}
          event={assemblyEvent}
          isCircuitUser
          congregationId=""
        />,
      );

      fireEvent.click(screen.getByText("Novo passageiro"));
      fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Ana Lima" } });
      fireEvent.change(screen.getByLabelText("RG"), { target: { value: "12.345.678-X" } });
      fireEvent.click(screen.getByRole("button", { name: "Inscrever" }));

      expect(await screen.findByText("Selecione a congregação do passageiro.")).toBeInTheDocument();
      expect(screen.getByLabelText("Congregação")).toHaveAttribute("aria-invalid", "true");
      expect(onSubmit).not.toHaveBeenCalled();

      fireEvent.change(screen.getByLabelText("Congregação"), { target: { value: "cong-2" } });
      fireEvent.click(screen.getByRole("button", { name: "Inscrever" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ name: "Ana Lima", rg: "12.345.678-X", congregationId: "cong-2" });
      });
    });
  });

  it("já escolhe a congregação do coordenador do circuito que tem uma, e busca no circuito", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser
        congregationId="cong-1"
      />,
    );

    fireEvent.change(screen.getByLabelText("Buscar passageiro"), { target: { value: "João" } });
    expect(screen.getByText("João Pereira")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Novo passageiro"));
    expect(screen.getByLabelText("Congregação")).toHaveValue("cong-1");
  });

  it("mostra a congregação do coordenador assim que as congregações chegam, sem cair no 'Selecione'", () => {
    mocks.failingQueries.add("congregations/select");

    const { rerender } = render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser
        congregationId="cong-2"
      />,
    );

    fireEvent.click(screen.getByText("Novo passageiro"));
    mocks.failingQueries.clear();
    rerender(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser
        congregationId="cong-2"
      />,
    );

    expect(screen.getByLabelText("Congregação")).toHaveValue("cong-2");
    expect(screen.getByRole("option", { name: "Congregação Norte" })).toHaveProperty("selected", true);
  });

  it("oferece tentar de novo quando as congregações não carregam", () => {
    mocks.failingQueries.add("congregations/select");

    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser
        congregationId=""
      />,
    );

    fireEvent.click(screen.getByText("Novo passageiro"));

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar as congregações.");

    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(mocks.refetch).toHaveBeenCalled();
  });

  it("não pede congregação do passageiro novo para os papéis da congregação", () => {
    render(
      <EnrollPassengerModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        event={baseEvent}
        isCircuitUser={false}
        congregationId="cong-1"
      />,
    );

    fireEvent.click(screen.getByText("Novo passageiro"));

    expect(screen.queryByLabelText("Congregação")).not.toBeInTheDocument();
  });
});
