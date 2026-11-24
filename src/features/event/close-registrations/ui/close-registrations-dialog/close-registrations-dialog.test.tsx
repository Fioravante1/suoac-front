import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
  today: "2026-10-07",
  useQuery: vi.fn(),
  counts: "ready" as "ready" | "loading" | "error",
}));

vi.mock("../../api", () => ({
  useCloseRegistrationsMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: mocks.isPending }),
}));
vi.mock("@/entities/event", async (importOriginal) => ({
  ...(await importOriginal()),
  getEventToday: () => mocks.today,
}));
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: (options: { queryKey: readonly string[] }) => {
    mocks.useQuery(options);

    if (mocks.counts === "loading") return { data: undefined, isLoading: true };
    if (mocks.counts === "error") return { data: undefined, isLoading: false, isError: true };

    if (options.queryKey.includes("event-statuses")) {
      return {
        data: [
          { status: CONGREGATION_LIST_STATUSES.FINALIZED, congregationName: "Centro" },
          { status: CONGREGATION_LIST_STATUSES.PENDING, congregationName: "Norte" },
          { status: CONGREGATION_LIST_STATUSES.PENDING, congregationName: "Sul" },
        ],
      };
    }

    return { data: { data: [], meta: { total: 874, page: 1, limit: 10, totalPages: 88 } } };
  },
}));

import { CONGREGATION_LIST_STATUSES } from "@/entities/congregation";
import { EVENT_DAY_STATUSES } from "@/entities/event";

import { CloseRegistrationsDialog } from "./close-registrations-dialog";

// "Inscrições até 12/10/2026", uma segunda-feira, e o evento em 23/10.
const event = {
  id: "event-1",
  registrationDeadline: "2026-10-13T02:59:59.999Z",
  days: [
    {
      id: "day-1",
      dayNumber: 1,
      date: "2026-10-23T00:00:00.000Z",
      label: "",
      departureTime: "06:30",
      returnTime: "18:30",
      status: EVENT_DAY_STATUSES.ACTIVE,
      eventId: "event-1",
    },
  ],
};

describe("CloseRegistrationsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPending = false;
    mocks.today = "2026-10-07";
    mocks.counts = "ready";
  });

  it("mostra o prazo, as consequências e as contagens do v3", () => {
    render(<CloseRegistrationsDialog event={event} open onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Encerrar inscrições agora?" })).toBeInTheDocument();
    expect(screen.getByText(/O prazo vai até segunda, 12\/10\. Depois de encerrar/)).toBeInTheDocument();
    expect(screen.getByText("Congregações que não finalizaram").nextSibling).toHaveTextContent("2 de 3");
    expect(screen.getByText("Passageiros inscritos").nextSibling).toHaveTextContent("874");
    expect(screen.getByText(/Depois de encerrar/)).toHaveTextContent(/Você pode reabrir depois\.$/);
  });

  it("depois do prazo, avisa que não será possível reabrir", () => {
    mocks.today = "2026-10-13";

    render(<CloseRegistrationsDialog event={event} open onClose={vi.fn()} />);

    expect(screen.getByText(/O prazo venceu em 12\/10/)).toHaveTextContent(/Não será possível reabrir depois\.$/);
  });

  it("pede as contagens só com a confirmação aberta, e sem derrubar a tela se falharem", () => {
    render(<CloseRegistrationsDialog event={event} open onClose={vi.fn()} />);

    expect(mocks.useQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true, throwOnError: false }));
    expect(mocks.useQuery.mock.calls.every(([options]) => options.throwOnError === false)).toBe(true);
  });

  it("mostra um esqueleto no lugar das contagens enquanto elas carregam", () => {
    mocks.counts = "loading";

    render(<CloseRegistrationsDialog event={event} open onClose={vi.fn()} />);

    expect(screen.getByText("Congregações que não finalizaram").nextSibling).toHaveTextContent(/^Carregando$/);
    expect(screen.getByText("Passageiros inscritos").nextSibling).toHaveTextContent(/^Carregando$/);
  });

  it("deixa a contagem que falhou com um traço", () => {
    mocks.counts = "error";

    render(<CloseRegistrationsDialog event={event} open onClose={vi.fn()} />);

    expect(screen.getByText("Congregações que não finalizaram").nextSibling).toHaveTextContent(/^—$/);
    expect(screen.getByText("Passageiros inscritos").nextSibling).toHaveTextContent(/^—$/);
  });

  it("encerra e fecha quando a API aceita", async () => {
    const onClose = vi.fn();
    mocks.mutateAsync.mockResolvedValue({ success: true, data: { id: "event-1" } });

    render(<CloseRegistrationsDialog event={event} open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Encerrar inscrições" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.mutateAsync).toHaveBeenCalled();
  });

  it("mostra a recusa da API na própria confirmação e não fecha", async () => {
    const onClose = vi.fn();
    mocks.mutateAsync.mockResolvedValue({ success: false, error: "Transição inválida: CLOSED → CLOSED" });

    render(<CloseRegistrationsDialog event={event} open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Encerrar inscrições" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Transição inválida: CLOSED → CLOSED");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("não deixa cancelar nem confirmar de novo enquanto encerra", () => {
    mocks.isPending = true;

    render(<CloseRegistrationsDialog event={event} open onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Encerrando…/ })).toBeDisabled();
  });

  it("cancela sem encerrar", () => {
    const onClose = vi.fn();

    render(<CloseRegistrationsDialog event={event} open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
});
