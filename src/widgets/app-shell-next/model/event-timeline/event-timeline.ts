import { EVENT_STATUSES, getEventPeriod, toEventCalendarDate, type Event, type EventPeriod } from "@/entities/event";
import { diffInCalendarDays, formatDayMonth, formatDayMonthRange, pluralize } from "@/shared/lib";

export const EVENT_STAGE_KEYS = {
  REGISTRATION_OPEN: "registrationOpen",
  REGISTRATION_CLOSED: "registrationClosed",
  EVENT: "event",
  FINISHED: "finished",
} as const;

export type EventStageKey = (typeof EVENT_STAGE_KEYS)[keyof typeof EVENT_STAGE_KEYS];

const STAGE_ORDER: readonly EventStageKey[] = [
  EVENT_STAGE_KEYS.REGISTRATION_OPEN,
  EVENT_STAGE_KEYS.REGISTRATION_CLOSED,
  EVENT_STAGE_KEYS.EVENT,
  EVENT_STAGE_KEYS.FINISHED,
];

/** Rótulos da linha de etapas no desktop (`SUOAC Dashboard v3.dc.html`). */
export const EVENT_STAGE_LABELS: Record<EventStageKey, string> = {
  [EVENT_STAGE_KEYS.REGISTRATION_OPEN]: "Inscrições abertas",
  [EVENT_STAGE_KEYS.REGISTRATION_CLOSED]: "Inscrições encerradas",
  [EVENT_STAGE_KEYS.EVENT]: "Evento",
  [EVENT_STAGE_KEYS.FINISHED]: "Finalizado",
};

/** Rótulos curtos do stepper do celular e do tablet (`SUOAC Dashboard Mobile.dc.html`). */
export const EVENT_STAGE_COMPACT_LABELS: Record<EventStageKey, string> = {
  [EVENT_STAGE_KEYS.REGISTRATION_OPEN]: "Abertas",
  [EVENT_STAGE_KEYS.REGISTRATION_CLOSED]: "Encerram",
  [EVENT_STAGE_KEYS.EVENT]: "Evento",
  [EVENT_STAGE_KEYS.FINISHED]: "Finalizado",
};

export type EventStageState = "done" | "current" | "upcoming";

/** Como o leitor de tela anuncia o estado de cada etapa, ao lado do rótulo. */
export const EVENT_STAGE_STATE_DESCRIPTIONS: Record<EventStageState, string> = {
  done: "concluída",
  current: "etapa atual",
  upcoming: "a seguir",
};

export interface EventStage {
  key: EventStageKey;
  state: EventStageState;
  /** Linha de apoio no desktop, como "12/10 · em 5 dias"; `null` quando não há o que dizer. */
  detail: string | null;
  /** Linha de apoio no stepper do celular, como "12/10 · 5 dias". */
  compactDetail: string | null;
  /** O encerramento ainda por vir: o desenho pinta a linha de apoio de âmbar. */
  isDeadlineAhead: boolean;
}

/** Quanto de cada um dos três trechos entre as quatro etapas já passou, de 0 a 1. */
export type EventTimelineSegments = readonly [number, number, number];

export interface EventTimeline {
  stages: readonly EventStage[];
  segments: EventTimelineSegments;
  /** A etapa atual está acontecendo: o marcador dela pulsa. Evento finalizado não pulsa. */
  isLive: boolean;
}

/**
 * Trecho entre abertura e encerramento sem a data de abertura (SUC-126): o mesmo preenchimento
 * fixo do stepper do celular no `Dashboard Mobile` (9% da largura, ou 36% do primeiro trecho).
 */
export const OPEN_SEGMENT_WITHOUT_START = 0.36;

const STAGE_INDEX: Record<EventStageKey, number> = Object.fromEntries(
  STAGE_ORDER.map((key, index) => [key, index]),
) as Record<EventStageKey, number>;

/**
 * A etapa em que o evento está. Com inscrições abertas, é a abertura, mesmo que o evento já
 * tenha começado: o prazo pode ser posterior ao primeiro dia, e a linha não pode dar as
 * inscrições por encerradas enquanto elas aceitam gente. Encerradas, a etapa passa ao evento no
 * primeiro dia dele, porque o status só vira `FINISHED` no dia seguinte ao último.
 */
function resolveCurrentStage(status: Event["status"], period: EventPeriod | null, today: string): EventStageKey {
  if (status === EVENT_STATUSES.FINISHED) return EVENT_STAGE_KEYS.FINISHED;
  if (status === EVENT_STATUSES.OPEN) return EVENT_STAGE_KEYS.REGISTRATION_OPEN;
  if (period && diffInCalendarDays(period.start, today) >= 0) return EVENT_STAGE_KEYS.EVENT;

  return EVENT_STAGE_KEYS.REGISTRATION_CLOSED;
}

function resolveStageState(stage: EventStageKey, current: EventStageKey): EventStageState {
  const offset = STAGE_INDEX[stage] - STAGE_INDEX[current];

  if (offset < 0) return "done";
  if (offset === 0) return "current";

  return "upcoming";
}

/** "hoje", "amanhã" ou "N dias" até o encerramento. */
function describeDaysUntil(daysLeft: number): string {
  if (daysLeft === 0) return "hoje";
  if (daysLeft === 1) return "amanhã";

  return `${daysLeft} ${pluralize(daysLeft, "dia")}`;
}

/**
 * O encerramento visto das inscrições abertas. `deadline` e `today` são datas de calendário em
 * São Paulo. Com o prazo já vencido e o evento ainda aberto, porque o ciclo de vida roda de hora
 * em hora ou a aba ficou aberta de um dia para o outro, sobra só a data, sem contagem nem âmbar.
 */
function describeDeadline(
  deadline: string,
  today: string,
): Pick<EventStage, "detail" | "compactDetail" | "isDeadlineAhead"> {
  const daysLeft = diffInCalendarDays(today, deadline);
  const date = formatDayMonth(deadline);

  if (daysLeft < 0) return { detail: date, compactDetail: date, isDeadlineAhead: false };

  const relative = describeDaysUntil(daysLeft);
  const isWithinDays = daysLeft > 1;

  return {
    detail: `${date} · ${isWithinDays ? `em ${relative}` : relative}`,
    compactDetail: `${date} · ${relative}`,
    isDeadlineAhead: true,
  };
}

/**
 * Inscrições já encerradas: a data do encerramento, quando a API a tem. Sem ela, como no
 * `Dashboard Mobile`: o rótulo do desktop basta, e o do celular ("Encerram") precisa do apoio.
 */
function describeRegistrationClosed(closedOn: string | null): Pick<EventStage, "detail" | "compactDetail"> {
  if (!closedOn) return { detail: null, compactDetail: "encerradas" };

  const date = formatDayMonth(closedOn);

  return { detail: `em ${date}`, compactDetail: `${date} · encerradas` };
}

/**
 * Quanto do período de inscrição já passou. Sem a data de abertura, o preenchimento fixo do
 * celular; com ela, os dias corridos sobre os dias do período (no `v3`, 16 de 21 dias = 76%).
 */
function resolveOpenSegment(openedOn: string | null, deadline: string, today: string): number {
  if (!openedOn) return OPEN_SEGMENT_WITHOUT_START;

  const totalDays = diffInCalendarDays(openedOn, deadline);

  if (totalDays <= 0) return 1;

  return Math.min(Math.max(diffInCalendarDays(openedOn, today) / totalDays, 0), 1);
}

function resolveSegments(
  current: EventStageKey,
  openedOn: string | null,
  deadline: string,
  today: string,
): EventTimelineSegments {
  if (current === EVENT_STAGE_KEYS.REGISTRATION_OPEN) return [resolveOpenSegment(openedOn, deadline, today), 0, 0];
  if (current === EVENT_STAGE_KEYS.REGISTRATION_CLOSED) return [1, 0, 0];
  if (current === EVENT_STAGE_KEYS.EVENT) return [1, 1, 0];

  return [1, 1, 1];
}

/**
 * A linha de etapas do resumo do evento: Inscrições abertas → Inscrições encerradas → Evento →
 * Finalizado, com a etapa atual, as linhas de apoio e o preenchimento de cada trecho.
 *
 * `today` é a data de calendário em São Paulo (`getEventToday`). Os dias do evento são datas
 * puras, gravadas à meia-noite UTC; o prazo, a abertura e o encerramento são instantes, lidos
 * como o dia deles em São Paulo (`toEventCalendarDate`).
 */
export function getEventTimeline(
  event: Pick<Event, "status" | "days" | "registrationDeadline" | "publishedAt" | "registrationClosedAt">,
  today: string,
): EventTimeline {
  const period = getEventPeriod(event.days ?? []);
  const current = resolveCurrentStage(event.status, period, today);
  const deadline = toEventCalendarDate(event.registrationDeadline);
  const openedOn = event.publishedAt ? toEventCalendarDate(event.publishedAt) : null;
  const closedOn = event.registrationClosedAt ? toEventCalendarDate(event.registrationClosedAt) : null;
  const isRegistrationOpen = current === EVENT_STAGE_KEYS.REGISTRATION_OPEN;
  const deadlineView = isRegistrationOpen ? describeDeadline(deadline, today) : null;
  const openedDetail = openedOn ? `desde ${formatDayMonth(openedOn)}` : null;
  const eventDates = period ? formatDayMonthRange(period.start, period.end) : null;
  const finishedDetail = period ? `após ${formatDayMonth(period.end)}` : null;

  const details: Record<EventStageKey, Pick<EventStage, "detail" | "compactDetail">> = {
    [EVENT_STAGE_KEYS.REGISTRATION_OPEN]: { detail: openedDetail, compactDetail: openedDetail },
    [EVENT_STAGE_KEYS.REGISTRATION_CLOSED]: deadlineView ?? describeRegistrationClosed(closedOn),
    [EVENT_STAGE_KEYS.EVENT]: { detail: eventDates, compactDetail: eventDates },
    [EVENT_STAGE_KEYS.FINISHED]: { detail: finishedDetail, compactDetail: finishedDetail },
  };

  const stages = STAGE_ORDER.map((key) => ({
    key,
    state: resolveStageState(key, current),
    detail: details[key].detail,
    compactDetail: details[key].compactDetail,
    isDeadlineAhead: key === EVENT_STAGE_KEYS.REGISTRATION_CLOSED && Boolean(deadlineView?.isDeadlineAhead),
  }));

  return {
    stages,
    segments: resolveSegments(current, openedOn, deadline, today),
    isLive: current !== EVENT_STAGE_KEYS.FINISHED,
  };
}
