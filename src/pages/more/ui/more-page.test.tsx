import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/widgets/app-shell-next", () => ({ MoreScreen: () => <h1>Tela Mais</h1> }));

import { MorePage } from "./more-page";

describe("MorePage", () => {
  it("apresenta a tela Mais do shell novo", () => {
    render(<MorePage />);

    expect(screen.getByRole("heading", { name: "Tela Mais" })).toBeInTheDocument();
  });
});
