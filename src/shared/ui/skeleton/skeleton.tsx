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

export function SkeletonTableRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className={styles.tableRows} role="status" aria-label="Carregando">
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
