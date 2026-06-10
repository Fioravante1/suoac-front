import { Skeleton, SkeletonTableRows } from "@/shared/ui/skeleton";

import styles from "./event-detail-skeleton.module.css";

function InfoItemSkeleton() {
  return (
    <div className={styles.infoItem}>
      <Skeleton className={`${styles.infoIcon}`} />
      <div className={styles.infoContent}>
        <Skeleton className={styles.infoLabel} />
        <Skeleton className={styles.infoValue} />
      </div>
    </div>
  );
}

function DayCardSkeleton() {
  return (
    <div className={styles.dayCard} aria-hidden="true">
      <div className={styles.dayHeader}>
        <Skeleton className={styles.dayLabel} />
        <Skeleton className={styles.dayBadge} />
      </div>
      <div className={styles.dayMeta}>
        <Skeleton className={styles.dayMetaLine} />
        <Skeleton className={styles.dayMetaLine} />
        <Skeleton className={styles.dayMetaLineShort} />
      </div>
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className={styles.content} role="status" aria-label="Carregando">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleGroup}>
            <Skeleton className={styles.typeLabel} />
            <Skeleton className={styles.title} />
          </div>
          <Skeleton className={styles.badge} />
        </div>
        <div className={styles.actions}>
          <Skeleton className={styles.actionButton} />
          <Skeleton className={styles.actionButton} />
          <Skeleton className={styles.actionButton} />
        </div>
      </div>

      {/* Info Row — two cards side-by-side on desktop */}
      <div className={styles.infoRow}>
        <div className={styles.card}>
          <Skeleton className={styles.cardTitle} />
          <div className={styles.infoGrid}>
            <InfoItemSkeleton />
            <InfoItemSkeleton />
            <InfoItemSkeleton />
          </div>
        </div>
        <div className={styles.card}>
          <Skeleton className={styles.cardTitle} />
          <div className={styles.infoGrid}>
            <InfoItemSkeleton />
            <InfoItemSkeleton />
            <InfoItemSkeleton />
          </div>
        </div>
      </div>

      {/* Days card — full width */}
      <div className={styles.card}>
        <Skeleton className={styles.cardTitle} />
        <div className={styles.daysList}>
          <DayCardSkeleton />
          <DayCardSkeleton />
        </div>
      </div>

      {/* Enrollments section — full width */}
      <div className={styles.card}>
        <div className={styles.enrollmentsHeader}>
          <Skeleton className={styles.enrollmentsTitle} />
          <Skeleton className={styles.enrollButton} />
        </div>
        <SkeletonTableRows rows={5} announce={false} />
      </div>
    </div>
  );
}
