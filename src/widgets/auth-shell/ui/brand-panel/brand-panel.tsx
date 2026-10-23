import Image from "next/image";

import { BrandPanelFrame } from "../brand-panel-frame";
import { JourneyTimeline } from "../journey-timeline";

import styles from "./brand-panel.module.css";

/**
 * Metade esquerda da tela de entrada: o que o SUOAC e, para quem chega.
 *
 * E navy nos dois temas, por decisao de marca — nao acompanha a preferencia de
 * tema do usuario. As cores vivem nos tokens `--suoac-color-brand-panel-*`,
 * declarados uma unica vez justamente por nao terem par claro/escuro.
 */
export function BrandPanel() {
  return (
    <BrandPanelFrame>
      <div className={styles.brand}>
        {/* O nome ao lado ja identifica a marca; a imagem e decorativa. */}
        <Image src="/logo-mark-dark.png" alt="" width={42} height={42} className={styles.logo} priority />
        <span className={styles.wordmark}>SUOAC</span>
      </div>

      <div className={styles.copy}>
        <h1 className={styles.headline}>Coordenação inteligente para o arranjo de ônibus.</h1>
        <p className={styles.tagline}>
          Mais que um sistema, uma ferramenta para pensar, coordenar e organizar cada viagem.
        </p>
      </div>

      <JourneyTimeline className={styles.journey} />
    </BrandPanelFrame>
  );
}
