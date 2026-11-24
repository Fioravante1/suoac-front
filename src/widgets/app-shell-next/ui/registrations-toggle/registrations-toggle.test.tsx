import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ reopen: vi.fn(), isReopening: false, renderDialog: vi.fn() }));

vi.mock("@/features/event/close-registrations", () => ({
  useReopenRegistrations: () => ({ reopen: mocks.reopen, isReopening: mocks.isReopening }),
  CloseRegistrationsDialog: (props: { open: boolean; onClose: () => void }) => {
    mocks.renderDialog(props);

    if (!props.open) return null;

    return (
      <div role="dialog" aria-label="Encerrar inscrições agora?">
        <button type="button" onClick={props.onClose}>
          Cancelar
        </button>
      </div>
    );
  },
}));

import { REGISTRATION_ACTIONS } from "../../model";

import { RegistrationsToggle } from "./registrations-toggle";

const event = { id: "event-1", registrationDeadline: "2026-10-13T02:59:59.999Z", days: [] };

describe("RegistrationsToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isReopening = false;
  });

  it("com as inscrições abertas, encerra pela confirmação", () => {
    render(<RegistrationsToggle event={event} action={REGISTRATION_ACTIONS.CLOSE} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Encerrar inscrições" }));
    expect(screen.getByRole("dialog", { name: "Encerrar inscrições agora?" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("com as inscrições encerradas que ainda reabrem, reabre direto, sem confirmação", () => {
    render(<RegistrationsToggle event={event} action={REGISTRATION_ACTIONS.REOPEN} />);

    fireEvent.click(screen.getByRole("button", { name: "Reabrir inscrições" }));

    expect(mocks.reopen).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("não deixa reabrir duas vezes enquanto reabre, sem tirar o foco do botão", () => {
    mocks.isReopening = true;

    render(<RegistrationsToggle event={event} action={REGISTRATION_ACTIONS.REOPEN} />);
    const button = screen.getByRole("button", { name: "Reabrindo…" });

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toBeEnabled();
    expect(mocks.reopen).not.toHaveBeenCalled();
  });

  it("mantém o foco no botão quando as inscrições encerram e reabrem", () => {
    const { rerender } = render(<RegistrationsToggle event={event} action={REGISTRATION_ACTIONS.CLOSE} />);
    screen.getByRole("button", { name: "Encerrar inscrições" }).focus();

    rerender(<RegistrationsToggle event={event} action={REGISTRATION_ACTIONS.REOPEN} />);
    expect(screen.getByRole("button", { name: "Reabrir inscrições" })).toHaveFocus();

    mocks.isReopening = true;
    rerender(<RegistrationsToggle event={event} action={REGISTRATION_ACTIONS.REOPEN} />);
    expect(screen.getByRole("button", { name: "Reabrindo…" })).toHaveFocus();
  });

  it("mantém a confirmação aberta quando o evento recarregado já não deixa encerrar", () => {
    const { rerender } = render(<RegistrationsToggle event={event} action={REGISTRATION_ACTIONS.CLOSE} />);

    fireEvent.click(screen.getByRole("button", { name: "Encerrar inscrições" }));
    rerender(<RegistrationsToggle event={event} action={null} />);

    expect(screen.getByRole("dialog", { name: "Encerrar inscrições agora?" })).toBeInTheDocument();
  });

  it("só monta a confirmação quando dá para encerrar", () => {
    render(<RegistrationsToggle event={event} action={REGISTRATION_ACTIONS.REOPEN} />);

    expect(mocks.renderDialog).not.toHaveBeenCalled();
  });

  it("some quando não dá para encerrar nem reabrir", () => {
    const { container } = render(<RegistrationsToggle event={event} action={null} />);

    expect(container).toBeEmptyDOMElement();
    expect(mocks.renderDialog).not.toHaveBeenCalled();
  });
});
