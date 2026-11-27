import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_TYPES, EVENT_STATUSES, type Event } from "@/entities/event";

const mocks = vi.hoisted(() => ({ publish: vi.fn(), error: null as string | null, query: vi.fn() }));
vi.mock("@/features/event/publish-event", () => ({
  usePublishEvent: () => ({ publish: mocks.publish, error: mocks.error, isPublishing: false }),
}));
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  useQuery: mocks.query,
}));
import { PanelDraftState } from "./panel-draft-state";

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

describe("PanelDraftState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.error = null;
    mocks.query.mockReturnValue({ data: { activeCongregationCount: 20 } });
  });

  it("mostra checklist real e mantém ônibus e aviso aos coordenadores em breve", () => {
    render(<PanelDraftState event={event} />);
    expect(screen.getByRole("heading", { name: event.title })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
    expect(screen.getByRole("button", { name: "Adicionar" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(/serão avisados.*em breve/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publicar e abrir inscrições" }));
    expect(mocks.publish).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Editar evento" })).toHaveAttribute("href", "/events/e1");
  });

  it.each(["422: Nenhum dia ativo", "403: Sem permissão", "Não foi possível publicar o evento."])(
    "mantém rascunho e mostra erro %s",
    (error) => {
      mocks.error = error;
      render(<PanelDraftState event={event} />);
      expect(screen.getByRole("alert")).toHaveTextContent(error);
      expect(screen.getByRole("heading", { name: event.title })).toBeInTheDocument();
    },
  );
  it("usa o total do checklist na progressão e texto acessível para os estados dos itens", () => {
    render(<PanelDraftState event={event} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "5");
    expect(screen.getByText("3 de 5 prontos")).toBeInTheDocument();
    expect(screen.getByText("3 de 5 itens prontos")).toBeInTheDocument();
    expect(screen.getAllByText("Pronto")).toHaveLength(3);
    expect(screen.getAllByText("Pendente")).toHaveLength(2);
  });
});
