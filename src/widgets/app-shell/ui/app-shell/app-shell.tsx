import type { ReactNode } from "react";

import { DesktopSidebar } from "../desktop-sidebar";
import { MobileBottomNav } from "../mobile-bottom-nav";
import styles from "./app-shell.module.css";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <DesktopSidebar />
      </div>

      <div className={styles.main}>
        <div className={styles.content}>{children}</div>
      </div>

      <div className={styles.bottomNav}>
        <MobileBottomNav />
      </div>
    </div>
  );
}
