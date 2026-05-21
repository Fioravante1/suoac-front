import type { ReactNode } from "react";

import styles from "./error-state.module.css";

interface ErrorStateProps {
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
}

export function ErrorState({ illustration, title, description, action, secondaryAction }: ErrorStateProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.layout}>
        {illustration && <div className={styles.illustration}>{illustration}</div>}
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
          {(action || secondaryAction) && (
            <div className={styles.actions}>
              {action}
              {secondaryAction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
