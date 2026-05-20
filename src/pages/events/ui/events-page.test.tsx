import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventsPage } from "./events-page";

describe("EventsPage", () => {
  it("renderiza o heading Eventos", () => {
    render(<EventsPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Eventos");
  });
});
