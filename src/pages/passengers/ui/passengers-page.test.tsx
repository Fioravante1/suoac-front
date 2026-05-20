import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PassengersPage } from "./passengers-page";

describe("PassengersPage", () => {
  it("renderiza o heading Passageiros", () => {
    render(<PassengersPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Passageiros");
  });
});
