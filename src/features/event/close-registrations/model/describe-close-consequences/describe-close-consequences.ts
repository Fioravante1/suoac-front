import { isWithinReopenWindow, type Event } from "@/entities/event";

import { describeCloseDeadline } from "../describe-close-deadline";

export interface CloseConsequences {
  /** O texto do desktop (`v3`): o prazo, o que muda para as congregações e se dá para reabrir. */
  full: string;
  /** O texto curto do bottom sheet do celular (`Dashboard Mobile`). */
  compact: string;
}

/**
 * O que a confirmação de encerrar diz. "Você pode reabrir depois" só quando dá: com o prazo
 * vencido ou o evento terminado, a API recusa reabrir, e a confirmação avisa que não haverá volta.
 */
export function describeCloseConsequences(
  event: Pick<Event, "registrationDeadline" | "days">,
  today: string,
): CloseConsequences {
  const reopen = isWithinReopenWindow(event, today) ? "Você pode reabrir depois." : "Não será possível reabrir depois.";

  return {
    full: `${describeCloseDeadline(event.registrationDeadline, today)} Depois de encerrar, as congregações não poderão cadastrar nem alterar passageiros. ${reopen}`,
    compact: `As congregações não poderão mais adicionar passageiros. ${reopen}`,
  };
}
