import type { ReactNode } from "react";

import { showPendingMenuItemsFlag } from "@/shared/feature-flags";

import { DesktopSidebar } from "../desktop-sidebar";
import { MobileBottomNav } from "../mobile-bottom-nav";
import styles from "./app-shell.module.css";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export async function AppShell({ children }: AppShellProps) {
  const showPendingItems = await showPendingMenuItemsFlag();

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <DesktopSidebar showPendingItems={showPendingItems} />
      </div>

      <div className={styles.main}>
        <div className={styles.content}>{children}</div>
      </div>

      <div className={styles.bottomNav}>
        <MobileBottomNav showPendingItems={showPendingItems} />
      </div>
    </div>
  );
}
