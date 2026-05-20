import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FinancialPage } from "./financial-page";

describe("FinancialPage", () => {
  it("renderiza o heading Financeiro", () => {
    render(<FinancialPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Financeiro");
  });
});
