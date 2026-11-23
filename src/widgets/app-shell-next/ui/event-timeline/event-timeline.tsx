import { Fragment, type CSSProperties } from "react";

import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import {
  EVENT_STAGE_LABELS,
  EVENT_STAGE_STATE_DESCRIPTIONS,
  type EventSummary,
  type EventTimeline as EventTimelineData,
} from "../../model";
import { EventDayTiles } from "../event-day-tiles";
import { StageMarker } from "../stage-marker";

import styles from "./event-timeline.module.css";

type EventTimelineProps = Readonly<{
  summary: Pick<EventSummary, "dayTiles" | "countdown" | "months">;
  timeline: EventTimelineData;
}>;

/**
 * Faixa de datas do resumo no desktop (`SUOAC Dashboard v3.dc.html`): os dias do evento com a
 * contagem regressiva e a linha de etapas, de Inscrições abertas a Finalizado. Cada trecho
 * entre etapas se preenche com o quanto dele já passou.
 */
export function EventTimeline({ summary, timeline }: EventTimelineProps) {
  const heading = summary.countdown ?? summary.months;
  const hasMonthsBelow = Boolean(summary.countdown && summary.months);

  return (
    <div className={styles.timeline}>
      <div className={styles.when}>
        <EventDayTiles tiles={summary.dayTiles} />
        <p className={styles.countdown}>
          {heading && <span className={styles.countdownHeading}>{heading}</span>}
          {hasMonthsBelow && <span className={styles.countdownMonths}>{summary.months}</span>}
        </p>
      </div>

      <ol className={styles.stages} aria-label="Etapas do evento">
        {timeline.stages.map((stage, index) => {
          const isCurrent = stage.state === "current";
          const segment = timeline.segments[index];

          return (
            <Fragment key={stage.key}>
              <li className={styles.stage} data-state={stage.state} aria-current={isCurrent ? "step" : undefined}>
                <StageMarker state={stage.state} isPulsing={isCurrent && timeline.isLive} />
                <span className={styles.stageText}>
                  <span className={styles.stageLabel}>
                    {EVENT_STAGE_LABELS[stage.key]}
                    <VisuallyHidden> ({EVENT_STAGE_STATE_DESCRIPTIONS[stage.state]})</VisuallyHidden>
                  </span>
                  {stage.detail && (
                    <span className={styles.stageDetail} data-deadline-ahead={stage.isDeadlineAhead || undefined}>
                      {stage.detail}
                    </span>
                  )}
                </span>
              </li>
              {segment !== undefined && (
                <li className={styles.segment} aria-hidden="true">
                  <span className={styles.segmentFill} style={{ "--segment-fill": segment } as CSSProperties} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
