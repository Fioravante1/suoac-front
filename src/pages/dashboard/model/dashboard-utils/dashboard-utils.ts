import type { DashboardPaymentBreakdown } from "../dashboard-types";

export type DeadlineUrgency = "safe" | "approaching" | "urgent" | "expired";

export function daysUntilDeadline(deadline: string): number {
  const dateOnly = deadline.includes("T") ? deadline.split("T")[0] : deadline;
  const deadlineDate = new Date(dateOnly + "T00:00:00Z");
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const diffMs = deadlineDate.getTime() - todayUtc.getTime();

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getDeadlineUrgency(days: number): DeadlineUrgency {
  if (days < 0) return "expired";
  if (days <= 3) return "urgent";
  if (days <= 7) return "approaching";

  return "safe";
}

export const DEADLINE_URGENCY_COLORS: Record<DeadlineUrgency, string> = {
  safe: "var(--suoac-color-success)",
  approaching: "var(--suoac-color-attention)",
  urgent: "var(--suoac-color-critical)",
  expired: "var(--suoac-color-critical-dark)",
};

export const DEADLINE_URGENCY_BG_COLORS: Record<DeadlineUrgency, string> = {
  safe: "var(--suoac-color-success-soft)",
  approaching: "var(--suoac-color-attention-soft)",
  urgent: "var(--suoac-color-critical-soft)",
  expired: "var(--suoac-color-critical-soft)",
};

export function totalFromBreakdown(breakdown: DashboardPaymentBreakdown): number {
  return breakdown.paid + breakdown.partial + breakdown.pending + breakdown.exempt;
}

export function getGreetingByTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";

  return "Boa noite";
}

export function formatDeadlineText(days: number): string {
  if (days < 0) return `Expirado ha ${Math.abs(days)} dia${Math.abs(days) !== 1 ? "s" : ""}`;
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanha";

  return `${days} dias restantes`;
}
