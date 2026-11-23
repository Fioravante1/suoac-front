import { useEffect, useState } from "react";

import { getEventToday } from "@/entities/event";

/** De quanto em quanto tempo o "hoje" é conferido: a virada do dia aparece em até um minuto. */
const CHECK_INTERVAL_MS = 60_000;

/**
 * O "hoje" do evento, em São Paulo, que acompanha a virada do dia: um painel aberto de um dia
 * para o outro não fica com a contagem e as etapas da véspera. Conferir a cada minuto custa uma
 * comparação de texto, e o React não renderiza de novo quando o dia é o mesmo.
 */
export function useEventToday(): string {
  const [today, setToday] = useState(() => getEventToday());

  useEffect(() => {
    const interval = window.setInterval(() => setToday(getEventToday()), CHECK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  return today;
}
