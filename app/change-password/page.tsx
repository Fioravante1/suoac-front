import type { Metadata } from "next";

import { ChangePasswordPage } from "@/pages/change-password";
import { LegacyThemeScope } from "@/shared/theme";

export const metadata: Metadata = {
  title: "Defina sua senha | SUOAC",
  description: "Crie sua nova senha para acessar o SUOAC.",
};

export default function Page() {
  /*
   * Tela ainda nao redesenhada, e por isso contida no tema claro: os tokens sao
   * globais, e o tema escuro a pintaria sem que o contraste dela tenha sido
   * verificado. Estava de fora da contencao — o login legado envolve a si
   * mesmo, o layout de `(private)` envolve as telas internas, e esta rota, que
   * nao mora em nenhum dos dois, passou batido. Sai junto com a tela, na Fatia
   * 10 (SUC-14).
   */
  return (
    <LegacyThemeScope>
      <ChangePasswordPage />
    </LegacyThemeScope>
  );
}
