import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_STATUSES, EVENT_TYPES, type Event } from "@/entities/event";

const mocks = vi.hoisted(() => ({
  useAuthPermissions: vi.fn(),
  useEnrollPassengerMutation: vi.fn(),
  mutateAsync: vi.fn(),
  modalProps: vi.fn(),
}));

vi.mock("@/shared/auth", () => ({ useAuthPermissions: mocks.useAuthPermissions }));
vi.mock("@/shared/theme", () => ({
  LegacyThemeScope: ({ children }: { children: ReactNode }) => <div data-testid="legacy-theme-scope">{children}</div>,
}));
vi.mock("@/features/enroll-passenger", () => ({
  useEnrollPassengerMutation: mocks.useEnrollPassengerMutation,
  EnrollPassengerModal: (props: {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: unknown) => Promise<unknown>;
    isCircuitUser: boolean;
    congregationId: string;
  }) => {
    mocks.modalProps(props);

    return (
      <div role="dialog" aria-label="Inscrever passageiro">
        <button type="button" onClick={() => void props.onSubmit({ name: "Ana" })}>
          Inscrever
        </button>
        <button type="button" onClick={props.onClose}>
          Fechar
        </button>
      </div>
    );
  },
}));

import { EnrollPassengerDialog } from "./enroll-passenger-dialog";

const event = {
  id: "event-1",
  title: "Congresso Regional 2026",
  type: EVENT_TYPES.REGIONAL_CONVENTION,
  status: EVENT_STATUSES.OPEN,
} as Event;

function renderInsideSummary(onClose = vi.fn()) {
  render(
    <section aria-label="Resumo do evento">
      <EnrollPassengerDialog event={event} onClose={onClose} />
    </section>,
  );
}

describe("EnrollPassengerDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useEnrollPassengerMutation.mockReturnValue({ mutateAsync: mocks.mutateAsync });
    mocks.useAuthPermissions.mockReturnValue({ userCongregationId: null, isCircuitUser: true });
  });

  it("abre o modal de inscrição de hoje fora de quem o monta, no tema das telas v1", () => {
    renderInsideSummary();

    const dialog = screen.getByRole("dialog", { name: "Inscrever passageiro" });

    expect(dialog.closest("section")).toBeNull();
    expect(dialog.closest("[data-testid='legacy-theme-scope']")).not.toBeNull();
  });

  it("abre para o circuito, que busca no circuito e escolhe a congregação", () => {
    renderInsideSummary();

    expect(mocks.modalProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true, isCircuitUser: true, congregationId: "" }),
    );
  });

  it("passa a congregação de quem a tem, mesmo sendo do circuito", () => {
    mocks.useAuthPermissions.mockReturnValue({ userCongregationId: "cong-1", isCircuitUser: true });

    renderInsideSummary();

    expect(mocks.modalProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ isCircuitUser: true, congregationId: "cong-1" }),
    );
  });

  it("inscreve pelo hook da feature, no evento recebido", () => {
    renderInsideSummary();

    fireEvent.click(screen.getByRole("button", { name: "Inscrever" }));

    expect(mocks.useEnrollPassengerMutation).toHaveBeenCalledWith("event-1");
    expect(mocks.mutateAsync).toHaveBeenCalledWith({ name: "Ana" });
  });

  it("avisa quem o abriu quando o modal fecha", () => {
    const onClose = vi.fn();

    renderInsideSummary(onClose);
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onClose).toHaveBeenCalled();
  });
});
