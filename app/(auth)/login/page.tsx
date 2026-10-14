import type { Metadata } from "next";

import { LoginPage } from "@/pages/login";
import { LoginPage as LoginPageNext } from "@/pages/login-next";
import { redesignLoginFlag } from "@/shared/feature-flags";
import { LegacyThemeScope } from "@/shared/theme";

export const metadata: Metadata = {
  title: "Entrar | SUOAC",
  description: "Faça login no SUOAC - Sistema Unificado de Ônibus para Assembleias e Congressos.",
};

/**
 * Fachada da Fatia 1: decide qual tela de entrada a URL `/login` serve.
 *
 * Este e o unico ponto de decisao entre as duas versoes — nenhum `if (flag)`
 * deve aparecer em outro lugar. A URL nao muda; o que muda e o que e renderizado
 * nela, e desligar a flag devolve a tela antiga sem deploy. Ver
 * `docs/architecture/SUOAC_ESTRATEGIA_REDESIGN.md` §2.
 *
 * No corte (SUC-34) o arquivo volta a ter uma linha.
 */
export default async function Page() {
  if (await redesignLoginFlag()) {
    return <LoginPageNext />;
  }

  /*
   * A contencao de tema fica aqui, e nao no layout de `(auth)`: o layout envolve
   * as duas versoes, e a tela nova nasce com os dois temas — travada no claro,
   * ela ignoraria o proprio seletor de tema. Sai junto com o slice antigo.
   */
  return (
    <LegacyThemeScope>
      <LoginPage />
    </LegacyThemeScope>
  );
}
