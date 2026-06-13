import type { ReactNode } from "react";

import { AppShell } from "@/widgets/app-shell";
import { SessionGuard } from "@/shared/auth";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <SessionGuard />
      {children}
    </AppShell>
  );
}
