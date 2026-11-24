import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useEventOverview: vi.fn() }));

vi.mock("../../model", async (importOriginal) => ({
  ...(await importOriginal()),
  useEventOverview: mocks.useEventOverview,
}));
vi.mock("../quick-actions-menu", () => ({
  QuickActionsMenu: ({
    event,
    canEnroll,
    registrationAction,
  }: {
    event: { id: string };
    canEnroll: boolean;
    registrationAction: string | null;
  }) => (
    <div role="group" aria-label="Dock">
      {`${event.id} ${canEnroll ? "inscreve" : "não inscreve"} ${registrationAction ?? "sem ação"}`}
    </div>
  ),
}));

import { REGISTRATION_ACTIONS } from "../../model";

import { QuickActionsDock } from "./quick-actions-dock";

const event = { id: "event-1", registrationDeadline: "2026-10-13T02:59:59.999Z", days: [] };

function ready(overrides: Record<string, unknown> = {}) {
  mocks.useEventOverview.mockReturnValue({
    status: "ready",
    event,
    isCircuitUser: true,
    canEnroll: true,
    registrationAction: REGISTRATION_ACTIONS.CLOSE,
    ...overrides,
  });
}

describe("QuickActionsDock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("monta o menu com o evento selecionado e as ações que ele permite", () => {
    ready({ canEnroll: false, registrationAction: REGISTRATION_ACTIONS.REOPEN });

    render(<QuickActionsDock />);

    expect(screen.getByRole("group", { name: "Dock" })).toHaveTextContent(
      `event-1 não inscreve ${REGISTRATION_ACTIONS.REOPEN}`,
    );
  });

  it("fica de fora para os papéis da congregação", () => {
    ready({ isCircuitUser: false });

    const { container } = render(<QuickActionsDock />);

    expect(container).toBeEmptyDOMElement();
  });

  it("fica de fora enquanto o evento carrega", () => {
    mocks.useEventOverview.mockReturnValue({ status: "loading" });

    const { container } = render(<QuickActionsDock />);

    expect(container).toBeEmptyDOMElement();
  });
});
