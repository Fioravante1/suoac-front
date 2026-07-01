import { describe, expect, it, vi } from "vitest";

const fetchEventsMock = vi.hoisted(() => vi.fn());

vi.mock("../event.queries", () => ({
  fetchEvents: fetchEventsMock,
}));

import { eventSelectOptions } from "./event-select-options";

describe("eventSelectOptions", () => {
  it("usa a query key de seleção e busca a primeira página com limite alto", () => {
    const options = eventSelectOptions("circuit-1");

    expect(options.queryKey).toEqual(["suoac", "events", "select", "circuit-1"]);
    expect(options.enabled).toBe(true);

    options.queryFn();
    expect(fetchEventsMock).toHaveBeenCalledWith("circuit-1", 1, 100);
  });

  it("desabilita a query quando não há circuitId", () => {
    expect(eventSelectOptions("").enabled).toBe(false);
  });
});
