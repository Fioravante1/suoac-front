import type { CSSProperties } from "react";

import styles from "./skeleton.module.css";

interface SkeletonProps {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  borderRadius?: CSSProperties["borderRadius"];
  className?: string;
}

export function Skeleton({ width, height, borderRadius, className }: SkeletonProps) {
  return (
    <span
      className={`${styles.bone} ${className ?? ""}`.trim()}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={className} role="status" aria-label="Carregando">
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className={`${styles.bone} ${styles.text}`}
          style={i === lines - 1 ? { width: "75%" } : undefined}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`${styles.card} ${className ?? ""}`.trim()} aria-hidden="true">
      <div className={styles.cardHeader}>
        <span className={`${styles.bone} ${styles.cardLabel}`} />
        <span className={`${styles.bone} ${styles.cardBadge}`} />
      </div>
      <span className={`${styles.bone} ${styles.cardTitle}`} />
      <div className={styles.cardMeta}>
        <span className={`${styles.bone} ${styles.cardMetaLine}`} />
        <span className={`${styles.bone} ${styles.cardMetaLine}`} />
        <span className={`${styles.bone} ${styles.cardMetaLineShort}`} />
      </div>
      <div className={styles.cardFooter}>
        <span className={`${styles.bone} ${styles.cardFooterLine}`} />
      </div>
    </div>
  );
}

export function SkeletonCardGrid({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={`${styles.cardGrid} ${className ?? ""}`.trim()} role="status" aria-label="Carregando">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

interface SkeletonTableRowsProps {
  rows?: number;
  announce?: boolean;
}

export function SkeletonTableRows({ rows = 5, announce = true }: SkeletonTableRowsProps) {
  return (
    <div
      className={styles.tableRows}
      role={announce ? "status" : undefined}
      aria-label={announce ? "Carregando" : undefined}
      aria-hidden={announce ? undefined : true}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.tableRow}>
          <span className={`${styles.bone} ${styles.tableCell}`} aria-hidden="true" />
          <span className={`${styles.bone} ${styles.tableCellShort}`} aria-hidden="true" />
          <span className={`${styles.bone} ${styles.tableCell}`} aria-hidden="true" />
          <span className={`${styles.bone} ${styles.tableCellShort}`} aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
