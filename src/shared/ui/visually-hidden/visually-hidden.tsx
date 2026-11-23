import type { ReactNode } from "react";

import styles from "./visually-hidden.module.css";

type VisuallyHiddenProps = Readonly<{ children: ReactNode }>;

/**
 * Texto só para leitor de tela, como o estado de uma etapa ao lado do rótulo ou a contagem de
 * requisitos cumpridos de uma senha.
 */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className={styles.root}>{children}</span>;
}
