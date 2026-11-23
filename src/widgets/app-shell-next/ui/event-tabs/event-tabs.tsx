"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { formatInteger } from "@/shared/lib";

import { getEventTabs, isEventTabActive, useEventTabCounts } from "../../model";

import styles from "./event-tabs.module.css";

type EventTabsProps = Readonly<{
  eventId: string;
  circuitId: string;
}>;

/**
 * Abas do painel do circuito no desktop (`SUOAC Dashboard v3.dc.html`), sob o resumo do evento.
 * São links: a aba ativa vem da rota, inclusive nas subrotas, e o Tab do teclado passa por
 * elas como por qualquer link. Passageiros e Congregações mostram o total das suas listas;
 * Passageiros leva aos inscritos do evento.
 */
export function EventTabs({ eventId, circuitId }: EventTabsProps) {
  const pathname = usePathname();
  const counts = useEventTabCounts(eventId, circuitId);

  return (
    <nav className={styles.tabs} aria-label="Seções do evento">
      {getEventTabs(eventId).map((tab) => {
        const isActive = pathname !== null && isEventTabActive(tab, pathname);
        const count = counts[tab.id];

        return (
          <Link key={tab.id} href={tab.href} className={styles.tab} aria-current={isActive ? "page" : undefined}>
            {tab.label}
            {/* O espaço some no flex, mas separa o número do nome para o leitor de tela. */}
            {count !== undefined && " "}
            {count !== undefined && <span className={styles.count}>{formatInteger(count)}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
