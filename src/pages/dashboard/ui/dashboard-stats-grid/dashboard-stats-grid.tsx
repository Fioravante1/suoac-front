import { CheckCircle, Clock, Users, Wallet } from "lucide-react";

import { formatCurrency } from "@/shared/lib";
import { Card } from "@/shared/ui/card";

import type { DashboardStats } from "../../model";

import styles from "./dashboard-stats-grid.module.css";

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  const hasPending = Number(stats.totalPending) > 0;

  return (
    <div className={styles.grid}>
      <Card className={styles.statCard}>
        <div className={styles.statIcon}>
          <Users size={18} />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statValue}>{stats.totalPassengers}</span>
          <span className={styles.statLabel}>Inscritos</span>
        </div>
      </Card>

      <Card className={styles.statCard}>
        <div className={styles.statIcon}>
          <Wallet size={18} />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statValue}>{formatCurrency(stats.totalExpected)}</span>
          <span className={styles.statLabel}>Valor esperado</span>
        </div>
      </Card>

      <Card className={styles.statCard}>
        <div className={`${styles.statIcon} ${styles.successIcon}`}>
          <CheckCircle size={18} />
        </div>
        <div className={styles.statContent}>
          <span className={`${styles.statValue} ${styles.successValue}`}>{formatCurrency(stats.totalReceived)}</span>
          <span className={styles.statLabel}>Recebido</span>
        </div>
      </Card>

      <Card className={styles.statCard}>
        <div className={`${styles.statIcon} ${hasPending ? styles.criticalIcon : styles.successIcon}`}>
          <Clock size={18} />
        </div>
        <div className={styles.statContent}>
          <span className={`${styles.statValue} ${hasPending ? styles.criticalValue : styles.successValue}`}>
            {formatCurrency(stats.totalPending)}
          </span>
          <span className={styles.statLabel}>Pendente</span>
        </div>
      </Card>
    </div>
  );
}
