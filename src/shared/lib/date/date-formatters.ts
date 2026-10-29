const BRAZILIAN_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

const BRAZILIAN_WEEKDAY_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  timeZone: "UTC",
});

const BRAZILIAN_WEEKDAY_SHORT_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  timeZone: "UTC",
});

const BRAZILIAN_SHORT_MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

export function formatDate(value: string): string {
  return BRAZILIAN_DATE_FORMATTER.format(new Date(value));
}

export function formatWeekday(value: string): string {
  return BRAZILIAN_WEEKDAY_FORMATTER.format(new Date(value));
}

/** Dia da semana abreviado e capitalizado, sem ponto final (ex.: "Sex", "Sáb"). */
export function formatWeekdayShort(value: string): string {
  const formatted = BRAZILIAN_WEEKDAY_SHORT_FORMATTER.format(new Date(value)).replace(/\.$/, "");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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

/** Dia e mês abreviado, sem o ponto do `Intl` (ex.: "23 out"). */
function formatDayAndShortMonth(date: Date): string {
  return `${date.getUTCDate()} ${BRAZILIAN_SHORT_MONTH_FORMATTER.format(date).replace(/\.$/, "")}`;
}

/**
 * Intervalo de datas curto, como o painel escreve o período de um evento: "14 nov",
 * "23–25 out" e "30 out – 1 nov". O ano só aparece quando não é o de `today` ("15 mar
 * 2025"); num intervalo que atravessa a virada do ano, aparece nas duas pontas.
 */
export function formatShortDateRange(start: string, end: string, today: Date = new Date()): string {
  const from = new Date(start);
  const to = new Date(end);
  const fromYear = from.getUTCFullYear();
  const toYear = to.getUTCFullYear();

  if (fromYear !== toYear) {
    return `${formatDayAndShortMonth(from)} ${fromYear} – ${formatDayAndShortMonth(to)} ${toYear}`;
  }

  const yearSuffix = fromYear === today.getFullYear() ? "" : ` ${fromYear}`;

  if (from.toISOString().slice(0, 10) === to.toISOString().slice(0, 10)) {
    return `${formatDayAndShortMonth(from)}${yearSuffix}`;
  }

  if (from.getUTCMonth() === to.getUTCMonth()) {
    return `${from.getUTCDate()}–${formatDayAndShortMonth(to)}${yearSuffix}`;
  }

  return `${formatDayAndShortMonth(from)} – ${formatDayAndShortMonth(to)}${yearSuffix}`;
}
