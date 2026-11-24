import { describe, expect, it, vi } from "vitest";

vi.mock("./congregation.queries", () => ({
  fetchCongregations: vi.fn(),
  fetchCongregation: vi.fn(),
  fetchCongregationEventStatuses: vi.fn(),
}));

import { congregationEventStatusesOptions } from "./congregation.options";
import { fetchCongregationEventStatuses } from "./congregation.queries";

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
