import { daysUntilEventDeadline, toEventCalendarDate } from "@/entities/event";
import { formatDayMonth, formatWeekday } from "@/shared/lib";

/**
 * A frase do prazo na confirmação de encerrar, como no `v3`: "O prazo vai até segunda, 12/10."
 * `today` é o dia de calendário em São Paulo. Com o prazo já vencido e o evento ainda aberto,
 * porque o ciclo de vida roda de hora em hora, a frase diz que ele venceu.
 */
export function describeCloseDeadline(deadline: string, today: string): string {
  const day = toEventCalendarDate(deadline);
  const date = formatDayMonth(day);
  const daysLeft = daysUntilEventDeadline(deadline, today);

  if (daysLeft < 0) return `O prazo venceu em ${date}.`;
  if (daysLeft === 0) return `O prazo vai até hoje, ${date}.`;

  return `O prazo vai até ${formatWeekday(day).replace(/-feira$/, "")}, ${date}.`;
}
