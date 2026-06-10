const BRAZILIAN_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

const BRAZILIAN_WEEKDAY_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  timeZone: "UTC",
});

export function formatDate(value: string): string {
  return BRAZILIAN_DATE_FORMATTER.format(new Date(value));
}

export function formatWeekday(value: string): string {
  return BRAZILIAN_WEEKDAY_FORMATTER.format(new Date(value));
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

export function getTodayDateString(): string {
  return toDateString(new Date());
}

export function daysFromToday(date: string): number {
  const dateOnly = date.includes("T") ? date.split("T")[0] : date;
  const target = new Date(dateOnly + "T00:00:00Z");
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const diffMs = target.getTime() - todayUtc.getTime();

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) return `Expirado hà ${Math.abs(days)} dia${Math.abs(days) !== 1 ? "s" : ""}`;
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";

  return `${days} dias restantes`;
}

export function formatDateRange(dates: string[]): string {
  const first = dates[0];
  if (!first) return "";

  const last = dates[dates.length - 1];
  if (last && first !== last) {
    return `${formatDate(first)} - ${formatDate(last)}`;
  }

  return formatDate(first);
}
