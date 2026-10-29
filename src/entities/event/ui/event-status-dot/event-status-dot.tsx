import type { EventStatusVariant } from "../../model";

import styles from "./event-status-dot.module.css";

type EventStatusDotProps = Readonly<{
  variant: EventStatusVariant;
  /** Fundo em que o ponto aparece: sobre o navy do painel, o neutro vira branco translúcido. */
  surface?: "default" | "navy";
  className?: string;
}>;

/**
 * Ponto de 8px com a cor do status do evento, a mesma variante do badge
 * (`EVENT_STATUS_BADGE_VARIANTS`). É decorativo: quem usa escreve o status por extenso.
 */
export function EventStatusDot({ variant, surface = "default", className }: EventStatusDotProps) {
  return (
    <span
      className={[styles.dot, className].filter(Boolean).join(" ")}
      data-variant={variant}
      data-surface={surface}
      aria-hidden="true"
    />
  );
}
