import type { ReactNode } from "react";

import { redesignAppShellFlag } from "@/shared/feature-flags";
import { SessionGuard } from "@/shared/auth";
import { LegacyThemeScope } from "@/shared/theme";
import { AppShell } from "@/widgets/app-shell";
import { AppShellNext } from "@/widgets/app-shell-next";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const useNewShell = await redesignAppShellFlag();

  // A guarda fica fora do shell novo: no Início, o PanelEventState troca o conteúdo pelos
  // estados sem evento, rascunho e cancelado, e a levaria junto.
  if (useNewShell) {
    return (
      <>
        <SessionGuard />
        <AppShellNext>{children}</AppShellNext>
      </>
    );
  }

  // O ramo legado preserva a contenção da casca inteira até o corte no SUC-114.
  return (
    <LegacyThemeScope>
      <AppShell>
        <SessionGuard />
        {children}
      </AppShell>
    </LegacyThemeScope>
  );
}
