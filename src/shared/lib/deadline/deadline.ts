export const DEADLINE_URGENCIES = {
  safe: "safe",
  approaching: "approaching",
  urgent: "urgent",
  expired: "expired",
} as const;

export type DeadlineUrgency = (typeof DEADLINE_URGENCIES)[keyof typeof DEADLINE_URGENCIES];

export function getDeadlineUrgency(days: number): DeadlineUrgency {
  if (days < 0) return DEADLINE_URGENCIES.expired;
  if (days <= 3) return DEADLINE_URGENCIES.urgent;
  if (days <= 7) return DEADLINE_URGENCIES.approaching;

  return DEADLINE_URGENCIES.safe;
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
