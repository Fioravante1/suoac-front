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
 * Flags do redesign.
 *
 * Sao flags de release: existem para serem removidas. Cada uma cobre uma fatia do
 * redesign (ver `docs/architecture/SUOAC_ESTRATEGIA_REDESIGN.md`), e o PR que cria
 * a flag cria tambem o card que a remove.
 *
 * Os tipos abaixo nao sao decorativos — obrigam, em tempo de compilacao, o
 * prefixo `REDESIGN_` e a existencia do card de remocao. E o que impede uma flag
 * temporaria de nascer sem data de morte.
 *
 * Regra de governanca: no maximo **duas** flags `REDESIGN_*` ligadas em producao
 * sem corte pendente. Na terceira, a prioridade passa a ser cortar, nao construir.
 */
interface RedesignFlagConfig {
  key: `REDESIGN_${string}`;
  description: string;
  /** Fatia a que pertence, como aparece no Jira. Ex.: "Fatia 1 — Login". */
  slice: string;
  /** Card que remove esta flag junto com o codigo antigo. */
  removalCard: `SUC-${number}`;
}

/**
 * Monta a descricao exibida no painel de flags da Vercel.
 *
 * Quem abre o painel — inclusive meses depois — precisa saber de imediato que a
 * flag e temporaria e qual card a remove, sem recorrer ao codigo.
 */
export function buildRedesignFlagDescription({
  description,
  slice,
  removalCard,
}: Omit<RedesignFlagConfig, "key">): string {
  return `[${slice}] ${description} Temporária — remover em ${removalCard}.`;
}

/** Cria uma flag de redesign ja no padrao de governanca. */
export function redesignFlag({ key, ...config }: RedesignFlagConfig) {
  return booleanFlag({ key, description: buildRedesignFlagDescription(config) });
}

/**
 * Exibe itens de menu cujas paginas ainda nao foram implementadas (ex.: Financeiro
 * e Configuracoes). Oculto por padrao caso a flag nao possa ser avaliada.
 *
 * Nao e flag de redesign: nao tem prazo nem card de remocao.
 */
export const showPendingMenuItemsFlag = booleanFlag({
  key: "SHOW_PENDING_MENU_ITEMS",
  description: "Exibe itens de menu cujas páginas ainda não foram implementadas (Financeiro, Configurações).",
});
