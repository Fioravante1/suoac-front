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

const BRAZILIAN_DAY_MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

const BRAZILIAN_MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

export function formatDaysRemaining(days: number): string {
  if (days < 0) return `Expirado hà ${Math.abs(days)} dia${Math.abs(days) !== 1 ? "s" : ""}`;
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";

  return `${days} dias restantes`;
}

/** Dia e mês com dois dígitos, sem o ano (ex.: "12/10"). Lê a data em UTC, como a API grava os dias. */
export function formatDayMonth(value: string): string {
  return BRAZILIAN_DAY_MONTH_FORMATTER.format(new Date(value));
}

/**
 * Intervalo de dias sem o ano, como a linha de etapas do evento escreve: "14/11" para um dia,
 * "23 a 25/10" dentro do mesmo mês e "30/10 a 01/11" quando o mês muda.
 */
export function formatDayMonthRange(start: string, end: string): string {
  const from = new Date(start);
  const to = new Date(end);
  const isSameDay = from.toISOString().slice(0, 10) === to.toISOString().slice(0, 10);
  const isSameMonth = from.getUTCFullYear() === to.getUTCFullYear() && from.getUTCMonth() === to.getUTCMonth();

  if (isSameDay) return formatDayMonth(start);
  if (isSameMonth) return `${String(from.getUTCDate()).padStart(2, "0")} a ${formatDayMonth(end)}`;

  return `${formatDayMonth(start)} a ${formatDayMonth(end)}`;
}

/**
 * Só o mês por extenso (ex.: "outubro"). Lê a data em UTC. Quem precisa do ano junto monta o
 * texto, em vez de separar o resultado do `Intl`, cuja forma depende do navegador.
 */
export function formatMonthName(value: string): string {
  return BRAZILIAN_MONTH_FORMATTER.format(new Date(value));
}

const CALENDAR_DATE_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function getCalendarDateFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = CALENDAR_DATE_FORMATTERS.get(timeZone);

  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  CALENDAR_DATE_FORMATTERS.set(timeZone, formatter);

  return formatter;
}

/**
 * Data de calendário ("2026-10-12") de um instante no fuso pedido. É o "hoje" de quem está
 * em São Paulo mesmo às 22h, quando em UTC já é o dia seguinte.
 *
 * Monta a data pelas partes, e não pelo texto formatado: a ordem do texto depende dos dados
 * de localidade do navegador, que já mudaram de uma versão para outra.
 */
export function toDateStringInTimeZone(date: Date, timeZone: string): string {
  const parts = getCalendarDateFormatter(timeZone).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

/**
 * Dias de calendário de `from` até `to`, negativo quando `to` vem antes. Aceita a data pura
 * ("2026-10-12") ou o ISO completo da API; só a data conta, lida em UTC.
 */
export function diffInCalendarDays(from: string, to: string): number {
  const fromTime = Date.parse(`${from.slice(0, 10)}T00:00:00Z`);
  const toTime = Date.parse(`${to.slice(0, 10)}T00:00:00Z`);

  return Math.round((toTime - fromTime) / MS_PER_DAY);
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
