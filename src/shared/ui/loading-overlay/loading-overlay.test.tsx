import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingOverlay } from "./loading-overlay";

describe("LoadingOverlay", () => {
  it("não renderiza nada quando fechado", () => {
    render(<LoadingOverlay open={false} label="Saindo..." />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Saindo...")).not.toBeInTheDocument();
  });

  it("renderiza o overlay com spinner e label quando aberto", () => {
    render(<LoadingOverlay open label="Saindo..." />);

    const overlay = screen.getByRole("alert");
    expect(overlay).toHaveAttribute("aria-busy", "true");
    expect(overlay).toHaveAttribute("aria-live", "assertive");
    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();
    expect(screen.getByText("Saindo...")).toBeInTheDocument();
  });

  it("renderiza apenas o spinner quando não há label", () => {
    render(<LoadingOverlay open />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();
  });
});
