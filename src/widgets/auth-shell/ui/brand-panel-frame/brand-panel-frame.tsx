import type { ReactNode } from "react";

import styles from "./brand-panel-frame.module.css";

interface BrandPanelFrameProps {
  /** Conteudo do painel, empilhado na coluna central. */
  children: ReactNode;
}

/**
 * Moldura navy do painel esquerdo das telas de acesso: fundo pontilhado, dois
 * aneis decorativos e a coluna de conteudo.
 *
 * Existe separada de `BrandPanel` porque o convite (SUC-27) ocupa o mesmo lado
 * com o cartao-ingresso em vez da apresentacao da marca, e os dois precisam
 * ser identicos no que e moldura. E navy nos dois temas, por decisao de marca.
 */
export function BrandPanelFrame({ children }: BrandPanelFrameProps) {
  return (
    <aside className={styles.panel}>
      <span className={styles.ringOuter} aria-hidden />
      <span className={styles.ringInner} aria-hidden />

      <div className={styles.content}>{children}</div>
    </aside>
  );
}
