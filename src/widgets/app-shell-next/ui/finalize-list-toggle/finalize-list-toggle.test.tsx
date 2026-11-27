import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CONGREGATION_LIST_STATUSES } from "@/entities/congregation";

import { FinalizeListToggle } from "./finalize-list-toggle";

const mocks = vi.hoisted(() => ({ assistant: false, toggle: vi.fn(), info: vi.fn() }));
vi.mock("@/shared/auth", () => ({
  useAuthPermissions: () => ({ isCongregationAssistant: mocks.assistant, userCongregationId: "c1" }),
}));
vi.mock("@/features/finalize-congregation-list", () => ({
  useToggleCongregationListStatus: () => ({ toggle: mocks.toggle, isUpdating: false }),
}));
vi.mock("@/shared/ui/toast", () => ({ useToast: () => ({ info: mocks.info }) }));

const { PENDING, FINALIZED } = CONGREGATION_LIST_STATUSES;

describe("Finalizar lista", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assistant = false;
  });

  it.each([
    { status: PENDING, label: "Finalizar lista", next: FINALIZED },
    { status: FINALIZED, label: "Reabrir lista", next: PENDING },
  ])("oferece a transição de $status ao coordenador", ({ status, label, next }) => {
    render(<FinalizeListToggle eventId="e1" status={status} />);

    fireEvent.click(screen.getByRole("button", { name: label }));

    expect(mocks.toggle).toHaveBeenCalledWith(next);
  });

  it("explica ao assistente sem enviar alteração", () => {
    mocks.assistant = true;
    render(<FinalizeListToggle eventId="e1" status={FINALIZED} />);
    const button = screen.getByRole("button", { name: "Finalizar lista" });

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription(/Apenas o coordenador/);
    fireEvent.click(button);
    expect(mocks.info).toHaveBeenCalled();
    expect(mocks.toggle).not.toHaveBeenCalled();
  });

  it("enquanto o status carrega, desabilita sem texto visível e explica ao leitor de tela", () => {
    render(<FinalizeListToggle eventId="e1" status={null} />);
    const button = screen.getByRole("button", { name: "Finalizar lista" });

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription("Carregando o status da lista.");
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(mocks.toggle).not.toHaveBeenCalled();
  });

  it("explica falha de consulta e permite tentar de novo sem alterar a lista", () => {
    const retry = vi.fn();
    render(<FinalizeListToggle eventId="e1" status={null} isStatusError onRetry={retry} />);
    const button = screen.getByRole("button", { name: "Finalizar lista" });

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription(/Não foi possível carregar o status/);
    fireEvent.click(button);
    expect(mocks.toggle).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
