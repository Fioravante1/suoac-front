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

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}
