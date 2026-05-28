import type { ReactNode } from "react";

import styles from "./info-card.module.css";

export interface InfoCardItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

type InfoCardVariant = "compact" | "grid" | "list";

interface InfoCardProps {
  items: InfoCardItem[];
  header?: ReactNode;
  footer?: ReactNode;
  footerClassName?: string;
  variant?: InfoCardVariant;
  className?: string;
}

const CONTAINER_STYLES: Record<InfoCardVariant, string> = {
  compact: styles.card,
  grid: styles.container,
  list: styles.card,
};

const LIST_STYLES: Record<InfoCardVariant, string> = {
  compact: styles.row,
  grid: styles.grid,
  list: styles.list,
};

function renderCompactItem(item: InfoCardItem) {
  return (
    <div key={item.label} className={styles.inlineItem}>
      <span className={styles.inlineLabel}>{item.label}</span>
      <span className={styles.inlineValue}>{item.value}</span>
    </div>
  );
}

function renderGridItem(item: InfoCardItem) {
  return (
    <div key={item.label} className={styles.gridItem}>
      {item.icon && <span className={styles.icon}>{item.icon}</span>}
      <div className={styles.gridContent}>
        <span className={styles.gridLabel}>{item.label}</span>
        <span className={styles.gridValue}>{item.value}</span>
      </div>
    </div>
  );
}

function renderListItem(item: InfoCardItem) {
  return (
    <div key={item.label} className={styles.listItem}>
      {item.icon && <span className={styles.listIcon}>{item.icon}</span>}
      <span>{item.value}</span>
    </div>
  );
}

const ITEM_RENDERERS: Record<InfoCardVariant, (item: InfoCardItem) => ReactNode> = {
  compact: renderCompactItem,
  grid: renderGridItem,
  list: renderListItem,
};

export function InfoCard({ items, header, footer, footerClassName, variant = "compact", className }: InfoCardProps) {
  const containerClass = `${CONTAINER_STYLES[variant]} ${className ?? ""}`.trim();
  const renderItem = ITEM_RENDERERS[variant];
  const isList = variant === "list";
  const footerClass = `${isList ? styles.listFooter : styles.footer} ${footerClassName ?? ""}`.trim();

  return (
    <div className={containerClass}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={LIST_STYLES[variant]}>{items.map(renderItem)}</div>
      {footer && <div className={footerClass}>{footer}</div>}
    </div>
  );
}
