import { useId } from "react";
import type { LucideIcon } from "lucide-react";

import styles from "./coming-soon-button.module.css";

type ComingSoonButtonProps = Readonly<{
  icon: LucideIcon;
  /** Nome do botão para leitor de tela, como "Buscar". */
  label: string;
}>;

/**
 * Botão de ícone da faixa cujo destino ainda não existe (busca e notificações, Fatia 9).
 * Fica no lugar do desenho, mas desabilitado: `aria-disabled` o mantém no Tab, para que
 * quem navega por teclado também descubra a dica "Em breve", que aparece abaixo dele.
 */
export function ComingSoonButton({ icon: Icon, label }: ComingSoonButtonProps) {
  const hintId = useId();

  return (
    <span className={styles.root}>
      <button type="button" className={styles.button} aria-label={label} aria-disabled="true" aria-describedby={hintId}>
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <span id={hintId} role="tooltip" className={styles.hint}>
        Em breve
      </span>
    </span>
  );
}
