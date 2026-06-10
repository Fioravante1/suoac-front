import type { DashboardPaymentBreakdown } from "../dashboard-types";

export function totalFromBreakdown(breakdown: DashboardPaymentBreakdown): number {
  return breakdown.paid + breakdown.partial + breakdown.pending + breakdown.exempt;
}
