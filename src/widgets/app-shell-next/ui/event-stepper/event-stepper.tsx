import type { CSSProperties } from "react";

import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { EVENT_STAGE_COMPACT_LABELS, EVENT_STAGE_STATE_DESCRIPTIONS, type EventTimeline } from "../../model";
import { StageMarker } from "../stage-marker";

import styles from "./event-stepper.module.css";

type EventStepperProps = Readonly<{ timeline: EventTimeline }>;

/**
 * Linha de etapas do celular e do tablet (`SUOAC Dashboard Mobile.dc.html`): quatro etapas com
 * rótulo curto sobre um trilho único, que se preenche até onde o evento chegou.
 */
export function EventStepper({ timeline }: EventStepperProps) {
  const [opened, closed, held] = timeline.segments;
  const progress = (opened + closed + held) / timeline.segments.length;

  return (
    <ol
      className={styles.stepper}
      aria-label="Etapas do evento"
      style={{ "--stepper-progress": progress } as CSSProperties}
    >
      {timeline.stages.map((stage) => {
        const isCurrent = stage.state === "current";

        return (
          <li
            key={stage.key}
            className={styles.step}
            data-state={stage.state}
            aria-current={isCurrent ? "step" : undefined}
          >
            <StageMarker state={stage.state} isPulsing={isCurrent && timeline.isLive} isCompact />
            <span className={styles.stepText}>
              <span className={styles.stepLabel}>
                {EVENT_STAGE_COMPACT_LABELS[stage.key]}
                <VisuallyHidden> ({EVENT_STAGE_STATE_DESCRIPTIONS[stage.state]})</VisuallyHidden>
              </span>
              {stage.compactDetail && (
                <span className={styles.stepDetail} data-deadline-ahead={stage.isDeadlineAhead || undefined}>
                  {stage.compactDetail}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
