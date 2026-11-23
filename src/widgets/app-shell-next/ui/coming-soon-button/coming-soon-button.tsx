"use client";

import { useEffect, useId, useState } from "react";
import type { LucideIcon } from "lucide-react";

import styles from "./coming-soon-button.module.css";

type ComingSoonButtonProps = Readonly<{
  /** Nome do botão: escrito nele quando não há ícone, ou só para leitor de tela, como "Buscar". */
  label: string;
  /** Com ícone, o botão é só o ícone, como a lupa da faixa; sem ele, é o texto, como no resumo. */
  icon?: LucideIcon;
}>;

/** Quanto tempo a dica fica à vista depois de um toque, que não tem hover para mantê-la. */
const TOUCH_HINT_DURATION_MS = 2000;

/**
 * Botão do shell cujo destino ainda não existe: busca e notificações (Fatia 9) na faixa, e
 * Encerrar inscrições (SUC-109) no resumo do evento. Fica no lugar do desenho, mas
 * desabilitado: `aria-disabled` o mantém no Tab, para que quem navega por teclado também
 * descubra a dica "Em breve", que aparece abaixo dele.
 */
export function ComingSoonButton({ label, icon: Icon }: ComingSoonButtonProps) {
  const hintId = useId();
  const kind = Icon ? "icon" : "text";
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
    <span className={styles.root} data-kind={kind} data-hint-shown={isHintShown || undefined}>
      <button
        type="button"
        className={styles.button}
        aria-label={Icon ? label : undefined}
        aria-disabled="true"
        aria-describedby={hintId}
        onClick={() => setHintShownAt(Date.now())}
        onBlur={() => setHintShownAt(null)}
      >
        {Icon && <Icon size={18} strokeWidth={1.8} aria-hidden="true" />}
        {!Icon && label}
      </button>
      <span id={hintId} role="tooltip" className={styles.hint}>
        Em breve
      </span>
    </span>
  );
}
