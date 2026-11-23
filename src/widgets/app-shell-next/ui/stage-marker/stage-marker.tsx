import type { EventStageState } from "../../model";

import styles from "./stage-marker.module.css";

type StageMarkerProps = Readonly<{
  state: EventStageState;
  /** A etapa atual de um evento em andamento: o aro pulsa. */
  isPulsing: boolean;
  /** Stepper do celular: o pulso abre um pouco menos, como no `Dashboard Mobile`. */
  isCompact?: boolean;
}>;

/**
 * Marcador de uma etapa do evento: aro vazio para o que está por vir, verde com o ponto para o
 * que passou e para a etapa atual. É decorativo: quem usa escreve a etapa por extenso.
 */
export function StageMarker({ state, isPulsing, isCompact = false }: StageMarkerProps) {
  return (
    <span
      className={styles.marker}
      data-state={state}
      data-pulsing={isPulsing || undefined}
      data-compact={isCompact || undefined}
      aria-hidden="true"
    >
      <span className={styles.dot} />
    </span>
  );
}
