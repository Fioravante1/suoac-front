import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  reopen: vi.fn(),
  isDesktop: true,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/features/event/close-registrations", () => ({
  useReopenRegistrations: () => ({ reopen: mocks.reopen, isReopening: false }),
  CloseRegistrationsDialog: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open && (
      <div role="dialog" aria-modal="true" aria-label="Encerrar inscrições agora?">
        <button type="button" onClick={onClose}>
          Cancelar
        </button>
      </div>
    ),
}));
vi.mock("../enroll-passenger-dialog", () => ({
  EnrollPassengerDialog: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-modal="true" aria-label="Inscrever passageiro">
      <button type="button" onClick={onClose}>
        Fechar
      </button>
    </div>
  ),
}));

import type { Event } from "@/entities/event";

import { REGISTRATION_ACTIONS } from "../../model";

import { QuickActionsMenu } from "./quick-actions-menu";

const event = { id: "event-1", registrationDeadline: "2026-10-13T02:59:59.999Z", days: [] } as unknown as Event;

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Ação rápida" }));

  return screen.getByRole("group", { name: "Ações rápidas" });
}

describe("QuickActionsMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isDesktop = true;
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: mocks.isDesktop })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("abre as quatro ações do desenho, com a dica e o atalho de cada uma", () => {
    render(<QuickActionsMenu event={event} canEnroll registrationAction={REGISTRATION_ACTIONS.CLOSE} />);

    const trigger = screen.getByRole("button", { name: "Ação rápida" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    const menu = openMenu();
    const names = ["Cadastrar passageiro", "Registrar pagamento", "Exportar listas", "Encerrar inscrições"];

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(within(menu).getAllByRole("button")).toEqual(
      names.map((name) => within(menu).getByRole("button", { name })),
    );
    expect(names.map((name) => within(menu).getByRole("button", { name }).getAttribute("aria-keyshortcuts"))).toEqual([
      "N",
      "P",
      "E",
      "X",
    ]);
    expect(within(menu).getByRole("button", { name: "Encerrar inscrições" })).toHaveAccessibleDescription(
      "Antes do prazo de 12/10",
    );
  });

  it("cadastra pelo modal de inscrição e devolve o foco ao +", () => {
    render(<QuickActionsMenu event={event} canEnroll registrationAction={REGISTRATION_ACTIONS.CLOSE} />);

    fireEvent.click(within(openMenu()).getByRole("button", { name: /Cadastrar passageiro/ }));

    expect(screen.getByRole("dialog", { name: "Inscrever passageiro" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Ações rápidas" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ação rápida" })).toHaveFocus();
  });

  it("leva o pagamento aos inscritos do evento e a exportação à aba Listas", () => {
    render(<QuickActionsMenu event={event} canEnroll registrationAction={REGISTRATION_ACTIONS.CLOSE} />);

    fireEvent.click(within(openMenu()).getByRole("button", { name: /Registrar pagamento/ }));
    expect(mocks.push).toHaveBeenLastCalledWith("/events/event-1#inscricoes");

    fireEvent.click(within(openMenu()).getByRole("button", { name: /Exportar listas/ }));
    expect(mocks.push).toHaveBeenLastCalledWith("/lists");
  });

  it("encerra pela mesma confirmação do resumo", () => {
    render(<QuickActionsMenu event={event} canEnroll registrationAction={REGISTRATION_ACTIONS.CLOSE} />);

    fireEvent.click(within(openMenu()).getByRole("button", { name: /Encerrar inscrições/ }));

    expect(screen.getByRole("dialog", { name: "Encerrar inscrições agora?" })).toBeInTheDocument();
  });

  it("com as inscrições encerradas que ainda reabrem, reabre direto pelo menu, sem Cadastrar", () => {
    render(<QuickActionsMenu event={event} canEnroll={false} registrationAction={REGISTRATION_ACTIONS.REOPEN} />);

    const menu = openMenu();

    expect(within(menu).queryByRole("button", { name: /Cadastrar passageiro/ })).not.toBeInTheDocument();
    const reopenItem = within(menu).getByRole("button", { name: "Reabrir inscrições" });

    expect(reopenItem).not.toHaveAttribute("aria-keyshortcuts");
    fireEvent.click(reopenItem);

    expect(mocks.reopen).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("não reabre pelo X, que só encerra: reabrir não tem confirmação", () => {
    render(<QuickActionsMenu event={event} canEnroll={false} registrationAction={REGISTRATION_ACTIONS.REOPEN} />);

    fireEvent.keyDown(document.body, { key: "x" });

    expect(mocks.reopen).not.toHaveBeenCalled();
  });

  it("atende os atalhos com o menu fechado", () => {
    render(<QuickActionsMenu event={event} canEnroll registrationAction={REGISTRATION_ACTIONS.CLOSE} />);

    fireEvent.keyDown(document.body, { key: "p" });
    expect(mocks.push).toHaveBeenCalledWith("/events/event-1#inscricoes");

    fireEvent.keyDown(document.body, { key: "N" });
    expect(screen.getByRole("dialog", { name: "Inscrever passageiro" })).toBeInTheDocument();
  });

  it("ignora os atalhos com um modal aberto", () => {
    render(<QuickActionsMenu event={event} canEnroll registrationAction={REGISTRATION_ACTIONS.CLOSE} />);

    fireEvent.keyDown(document.body, { key: "x" });
    fireEvent.keyDown(document.body, { key: "e" });

    expect(screen.getByRole("dialog", { name: "Encerrar inscrições agora?" })).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("ignora os atalhos abaixo do desktop, onde o dock não aparece", () => {
    mocks.isDesktop = false;
    render(<QuickActionsMenu event={event} canEnroll registrationAction={REGISTRATION_ACTIONS.CLOSE} />);

    fireEvent.keyDown(document.body, { key: "p" });

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("fecha com Esc, devolvendo o foco ao +, e com o clique fora", () => {
    render(<QuickActionsMenu event={event} canEnroll registrationAction={REGISTRATION_ACTIONS.CLOSE} />);

    openMenu();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.queryByRole("group", { name: "Ações rápidas" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ação rápida" })).toHaveFocus();

    openMenu();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("group", { name: "Ações rápidas" })).not.toBeInTheDocument();
  });

  it("com o foco num item do menu, o atalho devolve o foco ao + antes de o item sumir", () => {
    render(<QuickActionsMenu event={event} canEnroll registrationAction={REGISTRATION_ACTIONS.CLOSE} />);

    const paymentItem = within(openMenu()).getByRole("button", { name: /Registrar pagamento/ });
    paymentItem.focus();
    fireEvent.keyDown(paymentItem, { key: "x" });

    expect(screen.getByRole("dialog", { name: "Encerrar inscrições agora?" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Ações rápidas" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ação rápida" })).toHaveFocus();
  });
});
