import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeamPage } from "./team-page";

const mocks = vi.hoisted(() => ({ allowed: true, replace: vi.fn() }));
vi.mock("@/shared/auth", () => ({ useAuthPermissions: () => ({ isCongregationCoordinator: mocks.allowed }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));

describe("Equipe", () => {
  beforeEach(() => {
    mocks.allowed = true;
    vi.clearAllMocks();
  });

  it("mostra o destino futuro ao coordenador", () => {
    render(<TeamPage />);
    expect(screen.getByText("A gestão da equipe está a caminho")).toBeInTheDocument();
  });

  it("redireciona outros papéis", () => {
    mocks.allowed = false;
    const { container } = render(<TeamPage />);
    expect(container).toBeEmptyDOMElement();
    expect(mocks.replace).toHaveBeenCalledWith("/dashboard");
  });
});
