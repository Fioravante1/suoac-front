import { describe, expect, it } from "vitest";

import type { DashboardPaymentBreakdown } from "../dashboard-types";

import { totalFromBreakdown } from "./dashboard-utils";

describe("totalFromBreakdown", () => {
  it("soma todos os campos do breakdown", () => {
    const breakdown: DashboardPaymentBreakdown = {
      paid: 10,
      partial: 5,
      pending: 3,
      exempt: 2,
    };

    expect(totalFromBreakdown(breakdown)).toBe(20);
  });

  it("retorna 0 quando todos os campos sao zero", () => {
    const breakdown: DashboardPaymentBreakdown = {
      paid: 0,
      partial: 0,
      pending: 0,
      exempt: 0,
    };

    expect(totalFromBreakdown(breakdown)).toBe(0);
  });
});
