import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BusesPage } from "./buses-page";

describe("BusesPage", () => {
  it("apresenta a aba Ônibus", () => {
    render(<BusesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Ônibus" })).toBeInTheDocument();
  });

  it("explica que a gestão de ônibus ainda vai chegar e o que ela vai fazer", () => {
    render(<BusesPage />);

    expect(screen.getByRole("heading", { name: "A gestão de ônibus está a caminho" })).toBeInTheDocument();
    expect(screen.getByText(/distribuir os passageiros pelas poltronas/)).toBeInTheDocument();
  });
});
