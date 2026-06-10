import type { ReactNode } from "react";

import styles from "./tooltip.module.css";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className={styles.wrapper} data-tooltip={content}>
      {children}
    </span>
  );
}
