import { Suspense } from "react";

import { AuthShell } from "@/widgets/auth-shell";

import { AuthFlow } from "../auth-flow";

/**
 * Tela de entrada (Fatia 1 do redesign), servida por `app/(auth)/login/page.tsx`.
 *
 * A moldura em comum com as outras telas de acesso vive em
 * `@/widgets/auth-shell`.
 */
export function LoginPage() {
  return (
    <AuthShell>
      {/* O formulario le `returnUrl` e `sessionExpired` da URL, e `useSearchParams`
          exige fronteira de suspense para nao forcar a rota inteira a ser dinamica. */}
      <Suspense>
        <AuthFlow />
      </Suspense>
    </AuthShell>
  );
}
