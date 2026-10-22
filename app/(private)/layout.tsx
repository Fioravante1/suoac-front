import type { ReactNode } from "react";

import { AppShell } from "@/widgets/app-shell";
import { SessionGuard } from "@/shared/auth";
import { LegacyThemeScope } from "@/shared/theme";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  // Temporario: todas as telas autenticadas ainda sao v1. Conforme as fatias do
  // redesign forem cortadas, o escopo desce de nivel ate sair. Ver SUC-17.
  return (
    <LegacyThemeScope>
      <AppShell>
        <SessionGuard />
        {children}
      </AppShell>
    </LegacyThemeScope>
  );
}
