import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsPage } from "./settings-page";

describe("SettingsPage", () => {
  it("renderiza o heading Configurações", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Configurações");
  });
});
