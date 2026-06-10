import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

import styles from "./dashboard-skeleton.module.css";

export function DashboardSkeleton() {
  return (
    <div className={styles.container} role="status" aria-label="Carregando dashboard">
      {/* Greeting */}
      <div className={styles.greeting}>
        <Skeleton width="280px" height="36px" borderRadius="var(--suoac-radius-sm)" />
        <Skeleton width="180px" height="18px" borderRadius="var(--suoac-radius-sm)" />
      </div>

      {/* Hero card */}
      <Card>
        <div className={styles.heroContent}>
          <Skeleton width="60%" height="24px" borderRadius="var(--suoac-radius-sm)" />
          <Skeleton width="40%" height="16px" borderRadius="var(--suoac-radius-sm)" />
          <div className={styles.heroDetails}>
            <Skeleton width="200px" height="16px" borderRadius="var(--suoac-radius-sm)" />
            <Skeleton width="150px" height="16px" borderRadius="var(--suoac-radius-sm)" />
          </div>
          <div className={styles.deadlines}>
            <Skeleton width="100%" height="56px" borderRadius="var(--suoac-radius-md)" />
            <Skeleton width="100%" height="56px" borderRadius="var(--suoac-radius-md)" />
          </div>
          <Skeleton className={styles.heroLink} width="100px" height="16px" borderRadius="var(--suoac-radius-sm)" />
        </div>
      </Card>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <div className={styles.statCard}>
              <Skeleton width="36px" height="36px" borderRadius="var(--suoac-radius-md)" />
              <div className={styles.statContent}>
                <Skeleton width="100px" height="24px" borderRadius="var(--suoac-radius-sm)" />
                <Skeleton width="70px" height="14px" borderRadius="var(--suoac-radius-sm)" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Payment progress */}
      <Card>
        <div className={styles.progressContent}>
          <Skeleton width="120px" height="18px" borderRadius="var(--suoac-radius-sm)" />
          <Skeleton width="100%" height="16px" borderRadius="var(--suoac-radius-pill)" />
          <div className={styles.legendRow}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} width="70px" height="14px" borderRadius="var(--suoac-radius-sm)" />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
