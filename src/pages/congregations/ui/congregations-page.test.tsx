import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CongregationsPage } from "./congregations-page";

describe("CongregationsPage", () => {
  it("renderiza o heading Congregações", () => {
    render(<CongregationsPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Congregações");
  });
});
