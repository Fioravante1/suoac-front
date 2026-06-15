import "server-only";

import { flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";

/**
 * Feature flags do SUOAC, declaradas com o Flags SDK (`flags/next`) e conectadas
 * ao Vercel Flags via `vercelAdapter()`.
 *
 * Flags sao avaliadas server-side. Em Server Components, chame `await flag()` e
 * repasse o resultado aos Client Components via props.
 */

const BOOLEAN_OPTIONS = [
  { value: false, label: "Off" },
  { value: true, label: "On" },
];

interface BooleanFlagConfig {
  key: string;
  description: string;
  /** Valor usado quando a flag nao puder ser avaliada. Padrao: `false`. */
  defaultValue?: boolean;
}

/**
 * Cria uma flag booleana ja conectada ao Vercel Flags, evitando repetir
 * `options`/`adapter` a cada declaracao. Para adicionar uma flag nova, basta
 * informar `key` e `description`.
 */
function booleanFlag({ defaultValue = false, ...config }: BooleanFlagConfig) {
  return flag<boolean>({
    ...config,
    defaultValue,
    options: BOOLEAN_OPTIONS,
    adapter: vercelAdapter(),
  });
}

/**
 * Exibe itens de menu cujas paginas ainda nao foram implementadas (ex.: Financeiro
 * e Configuracoes). Oculto por padrao caso a flag nao possa ser avaliada.
 */
export const showPendingMenuItemsFlag = booleanFlag({
  key: "SHOW_PENDING_MENU_ITEMS",
  description: "Exibe itens de menu cujas páginas ainda não foram implementadas (Financeiro, Configurações).",
});
