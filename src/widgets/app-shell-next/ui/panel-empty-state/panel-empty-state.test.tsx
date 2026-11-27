import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn(), retry: vi.fn() }));
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  useQuery: mocks.query,
}));
vi.mock("@/shared/auth", () => ({ useAuthPermissions: () => ({ userCircuitId: "c1" }) }));
import { PanelEmptyState } from "./panel-empty-state";

describe("PanelEmptyState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockReturnValue({
      data: undefined,
      isPending: false,
      isSuccess: true,
      isError: false,
      refetch: mocks.retry,
    });
  });

  it("orienta a criar evento e não oferece duplicação sem passado", () => {
    render(<PanelEmptyState />);
    expect(screen.getByRole("heading", { name: "Nenhum evento em andamento" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar evento" })).toHaveAttribute("href", "/events");
    expect(screen.queryByRole("button", { name: "Duplicar o último" })).not.toBeInTheDocument();
    expect(screen.getByText("Nenhum evento anterior registrado.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver convites" })).toHaveAttribute("href", "/congregations");
  });

  it("mostra contagens e eventos reais com duplicação em breve", () => {
    mocks.query
      .mockReturnValueOnce({
        data: { activeCongregationCount: 20, activeCoordinatorCount: 18, pendingInvitationCount: 2 },
      })
      .mockReturnValueOnce({
        data: {
          data: [
            {
              id: "e1",
              title: "Assembleia anterior",
              status: "FINISHED",
              type: "ASSEMBLY",
              createdAt: "2026-05-01T00:00:00Z",
              days: [],
            },
          ],
        },
        isSuccess: true,
      });
    render(<PanelEmptyState />);
    expect(screen.getByText("Assembleia anterior")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Duplicar o último" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("20 congregações · 18 coordenadores ativos · 2 convites pendentes")).toHaveLength(2);
  });

  it("oferece nova tentativa quando a lista falha", () => {
    mocks.query.mockReturnValue({ isError: true, refetch: mocks.retry });
    render(<PanelEmptyState />);
    fireEvent.click(screen.getAllByRole("button", { name: "Tentar de novo" })[0]!);
    expect(mocks.retry).toHaveBeenCalled();
  });
  it("concorda o resumo e a orientação quando há uma congregação, um coordenador e um convite", () => {
    mocks.query
      .mockReturnValueOnce({
        data: { activeCongregationCount: 1, activeCoordinatorCount: 1, pendingInvitationCount: 1 },
      })
      .mockReturnValueOnce({ data: { data: [] }, isSuccess: true });
    render(<PanelEmptyState />);
    expect(screen.getAllByText("1 congregação · 1 coordenador ativo · 1 convite pendente")).toHaveLength(2);
    expect(screen.getByText(/os coordenadores da 1 congregação podem/)).toBeInTheDocument();
  });
});
