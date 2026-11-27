"use client";

import { useEffect, useId, useState } from "react";
import type { LucideIcon } from "lucide-react";

import styles from "./coming-soon-button.module.css";

type ComingSoonButtonProps = Readonly<{
  /** Texto da ação; nos botões só de ícone, fornece o nome acessível. */
  label: string;
  icon?: LucideIcon;
  variant?: "icon" | "navy-primary" | "navy-outline" | "surface-outline" | "compact";
}>;

/** Quanto tempo a dica fica à vista depois de um toque, que não tem hover para mantê-la. */
const TOUCH_HINT_DURATION_MS = 2000;

/**
 * Ação ainda indisponível no painel, com ícone ou texto visível. Continua no Tab e explica
 * "Em breve" em hover, foco e toque, sem enviar formulários nem executar a ação futura.
 */
export function ComingSoonButton({
  label,
  icon: Icon,
  variant = Icon ? "icon" : "surface-outline",
}: ComingSoonButtonProps) {
  const isIconOnly = variant === "icon";
  const hintId = useId();
  // No toque não há hover, e o foco por toque não é `:focus-visible`: o clique mostra a dica.
  // Guarda o momento do toque, e não só "visível", para um novo toque reiniciar a contagem.
  const [hintShownAt, setHintShownAt] = useState<number | null>(null);
  const isHintShown = hintShownAt !== null;

  useEffect(() => {
    if (hintShownAt === null) return;

    const timer = window.setTimeout(() => setHintShownAt(null), TOUCH_HINT_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [hintShownAt]);

  return (
    <span className={styles.root} data-hint-shown={isHintShown || undefined}>
      <button
        type="button"
        className={styles.button}
        data-variant={variant}
        aria-label={isIconOnly ? label : undefined}
        aria-disabled="true"
        aria-describedby={hintId}
        onClick={() => setHintShownAt(Date.now())}
        onBlur={() => setHintShownAt(null)}
      >
        {Icon && <Icon size={18} strokeWidth={1.8} aria-hidden="true" />}
        {!isIconOnly && label}
      </button>
      <span id={hintId} role="tooltip" className={styles.hint}>
        Em breve
      </span>
    </span>
  );
}
