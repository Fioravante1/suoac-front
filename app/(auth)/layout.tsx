import type { ReactNode } from "react";

import { LegacyThemeScope } from "@/shared/theme";

import styles from "./layout.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  // Temporario: as telas de autenticacao ainda sao v1. O escopo sai quando a
  // Fatia 1 for cortada. Ver SUC-17.
  return (
    <LegacyThemeScope>
      <div className={styles.layout}>
        <main className={styles.main}>{children}</main>
      </div>
    </LegacyThemeScope>
  );
}
