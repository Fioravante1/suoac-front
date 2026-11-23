import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventDayTiles } from "./event-day-tiles";

const tiles = [
  { id: "day-1", weekday: "Sex", day: "23" },
  { id: "day-2", weekday: "Sáb", day: "24" },
  { id: "day-3", weekday: "Dom", day: "25" },
];

describe("EventDayTiles", () => {
  it("lista os dias do evento, cada um com o dia da semana e o número", () => {
    render(<EventDayTiles tiles={tiles} />);

    const items = within(screen.getByRole("list", { name: "Dias do evento" })).getAllByRole("listitem");

    expect(items.map((item) => item.textContent)).toEqual(["Sex23", "Sáb24", "Dom25"]);
  });

  it("marca a versão compacta do celular", () => {
    render(<EventDayTiles tiles={tiles} isCompact />);

    expect(screen.getByRole("list", { name: "Dias do evento" })).toHaveAttribute("data-compact", "true");
  });
});
