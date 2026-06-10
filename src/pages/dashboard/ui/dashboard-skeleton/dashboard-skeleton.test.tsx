import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardSkeleton } from "./dashboard-skeleton";

describe("DashboardSkeleton", () => {
  it("renderiza com role status e aria-label", () => {
    render(<DashboardSkeleton />);

    expect(screen.getByRole("status", { name: "Carregando dashboard" })).toBeInTheDocument();
  });
});
