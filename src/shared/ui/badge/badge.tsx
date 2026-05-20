import type { ReactNode } from "react";

import styles from "./badge.module.css";

type BadgeVariant = "success" | "critical" | "attention" | "info" | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const classes = [styles.badge, styles[`variant-${variant}`], className].filter(Boolean).join(" ");

  return <span className={classes}>{children}</span>;
}
