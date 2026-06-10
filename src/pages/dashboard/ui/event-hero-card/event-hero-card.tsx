import { ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import Link from "next/link";

import { EVENT_STATUS_BADGE_VARIANTS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/entities/event";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { routes } from "@/shared/config";
import { formatDate } from "@/shared/lib";

import type { DashboardEvent } from "../../model";
import {
  daysUntilDeadline,
  formatDeadlineText,
  getDeadlineUrgency,
  DEADLINE_URGENCY_COLORS,
  DEADLINE_URGENCY_BG_COLORS,
} from "../../model";

import styles from "./event-hero-card.module.css";

interface EventHeroCardProps {
  event: DashboardEvent;
}

export function EventHeroCard({ event }: EventHeroCardProps) {
  const registrationDays = daysUntilDeadline(event.registrationDeadline);
  const paymentDays = daysUntilDeadline(event.paymentDeadline);
  const registrationUrgency = getDeadlineUrgency(registrationDays);
  const paymentUrgency = getDeadlineUrgency(paymentDays);

  const firstDay = event.days[0];
  const lastDay = event.days[event.days.length - 1];
  const dateRange =
    firstDay && lastDay && firstDay.date !== lastDay.date
      ? `${formatDate(firstDay.date)} - ${formatDate(lastDay.date)}`
      : firstDay
        ? formatDate(firstDay.date)
        : "";

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{event.title}</h3>
          <Badge variant={EVENT_STATUS_BADGE_VARIANTS[event.status]}>{EVENT_STATUS_LABELS[event.status]}</Badge>
        </div>
        <span className={styles.type}>{EVENT_TYPE_LABELS[event.type]}</span>
      </div>

      <div className={styles.details}>
        <div className={styles.detailItem}>
          <MapPin size={16} />
          <span>
            {event.venue} - {event.city}/{event.state}
          </span>
        </div>
        {dateRange && (
          <div className={styles.detailItem}>
            <Calendar size={16} />
            <span>{dateRange}</span>
          </div>
        )}
      </div>

      <div className={styles.deadlines}>
        <div
          className={styles.deadlineCard}
          style={{
            borderColor: DEADLINE_URGENCY_COLORS[registrationUrgency],
            backgroundColor: DEADLINE_URGENCY_BG_COLORS[registrationUrgency],
          }}
        >
          <Clock size={14} style={{ color: DEADLINE_URGENCY_COLORS[registrationUrgency] }} />
          <div className={styles.deadlineContent}>
            <span className={styles.deadlineLabel}>Inscricao</span>
            <span className={styles.deadlineValue} style={{ color: DEADLINE_URGENCY_COLORS[registrationUrgency] }}>
              {formatDeadlineText(registrationDays)}
            </span>
          </div>
        </div>

        <div
          className={styles.deadlineCard}
          style={{
            borderColor: DEADLINE_URGENCY_COLORS[paymentUrgency],
            backgroundColor: DEADLINE_URGENCY_BG_COLORS[paymentUrgency],
          }}
        >
          <Clock size={14} style={{ color: DEADLINE_URGENCY_COLORS[paymentUrgency] }} />
          <div className={styles.deadlineContent}>
            <span className={styles.deadlineLabel}>Pagamento</span>
            <span className={styles.deadlineValue} style={{ color: DEADLINE_URGENCY_COLORS[paymentUrgency] }}>
              {formatDeadlineText(paymentDays)}
            </span>
          </div>
        </div>
      </div>

      <Link href={routes.eventDetail(event.id)} className={styles.link}>
        Ver evento
        <ArrowRight size={16} />
      </Link>
    </Card>
  );
}
