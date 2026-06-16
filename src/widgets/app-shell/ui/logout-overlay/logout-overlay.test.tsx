import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockUseFormStatus = vi.fn();

vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  useFormStatus: () => mockUseFormStatus(),
}));

import { LogoutOverlay } from "./logout-overlay";

describe("LogoutOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não exibe overlay quando o form está ocioso", () => {
    mockUseFormStatus.mockReturnValue({ pending: false });

    render(<LogoutOverlay />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("exibe overlay com 'Saindo...' enquanto o logout está em andamento", () => {
    mockUseFormStatus.mockReturnValue({ pending: true });

    render(<LogoutOverlay />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Saindo...")).toBeInTheDocument();
  });
});
