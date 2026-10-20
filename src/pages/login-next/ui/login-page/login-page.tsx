import { Suspense } from "react";

import { AuthShell } from "@/widgets/auth-shell";

import { AuthFlow } from "../auth-flow";

/**
 * Tela de entrada redesenhada (Fatia 1 do redesign).
 *
 * A ligacao acontece na fachada de `app/(auth)/login/page.tsx`, atras da flag
 * `REDESIGN_LOGIN` — ver `docs/architecture/SUOAC_ESTRATEGIA_REDESIGN.md` §2.
 *
 * Este slice nunca importa de `@/pages/login`, e vice-versa: qualquer
 * dependencia entre os dois impediria o corte limpo do legado. A moldura em
 * comum com as outras telas de acesso vive em `@/widgets/auth-shell`.
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
