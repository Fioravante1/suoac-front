import { Card } from "@/shared/ui/card";
import { formatWeekdayShort, pluralize } from "@/shared/lib";

import type { DashboardDayCount } from "../../model";

import styles from "./passengers-by-day.module.css";

interface PassengersByDayProps {
  days: DashboardDayCount[];
  totalPassengers: number;
}

export function PassengersByDay({ days, totalPassengers }: PassengersByDayProps) {
  if (days.length === 0) {
    return null;
  }

  const total = Math.max(totalPassengers, 1);

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <h4 className={styles.title}>Presença por dia</h4>
        <p className={styles.note}>
          De {totalPassengers} {pluralize(totalPassengers, "inscrito")}, quantos vão em cada dia
        </p>
      </div>

      <div className={styles.chart}>
        {days.map((day, index) => {
          const percentage = Math.min(100, Math.round((day.totalPassengers / total) * 100));

          return (
            <div key={day.eventDayId} className={styles.column}>
              <span className={styles.value}>{day.totalPassengers}</span>

              <div
                className={styles.barArea}
                role="meter"
                aria-valuenow={day.totalPassengers}
                aria-valuemin={0}
                aria-valuemax={totalPassengers}
                aria-label={`${day.label}: ${day.totalPassengers} de ${totalPassengers} ${pluralize(totalPassengers, "inscrito")}`}
              >
                <div className={styles.bar} style={{ height: `${percentage}%`, animationDelay: `${index * 90}ms` }} />
              </div>

              <span className={styles.weekday}>{formatWeekdayShort(day.date)}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
