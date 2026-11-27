import { describe, expect, it, vi } from "vitest";

import { congregationEventStatusOptions, congregationEventStatusesOptions } from "./congregation.options";
import { fetchCongregationEventStatuses } from "./congregation.queries";

vi.mock("./congregation.queries", () => ({
  fetchCongregations: vi.fn(),
  fetchCongregation: vi.fn(),
  fetchCongregationEventStatuses: vi.fn(),
  fetchCongregationEventStatus: vi.fn(),
}));

describe("congregationEventStatusesOptions", () => {
  it("consulta a situação das congregações do evento, numa chave própria do evento", async () => {
    const options = congregationEventStatusesOptions("event-1");

    expect(options.queryKey).toEqual(["suoac", "congregations", "event-statuses", "event-1"]);
    expect(options.enabled).toBe(true);

    await options.queryFn();

    expect(fetchCongregationEventStatuses).toHaveBeenCalledWith("event-1");
  });

  it("não consulta sem evento", () => {
    expect(congregationEventStatusesOptions("").enabled).toBe(false);
  });
});

describe("congregationEventStatusOptions", () => {
  it("consulta status só com evento e congregação válidos", () => {
    expect(congregationEventStatusOptions("", "c1").enabled).toBe(false);
    expect(congregationEventStatusOptions("e1", "").enabled).toBe(false);
    expect(congregationEventStatusOptions("e1", "c1").queryKey).toEqual([
      "suoac",
      "congregations",
      "event-status",
      "e1",
      "c1",
    ]);
  });
});
