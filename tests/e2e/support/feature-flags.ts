import type { BrowserContext } from "@playwright/test";
import { encryptOverrides } from "flags";

import { E2E_BASE_URL, E2E_FLAGS_SECRET } from "./environment";

/**
 * Forca o valor de flags para o contexto do navegador, pelo mecanismo do proprio
 * Flags SDK: o cookie `vercel-flag-overrides` e lido antes do adapter ser
 * consultado, entao o valor forcado vence sem depender de rede nem de painel.
 *
 * Hoje nenhum teste o usa: a unica fachada com flag (login, Fatia 1) foi cortada
 * em SUC-34. Fica para a proxima fatia: todo teste de fachada precisa dizer
 * explicitamente de que lado esta, ligado ou desligado. Sem o override, o valor viria do painel da
 * Vercel — no CI nenhuma chave esta configurada e tudo cai no `defaultValue`, mas
 * na maquina de quem desenvolve a chave vem do `.env.local` e o resultado passa a
 * depender do ambiente `development`, que muda sem avisar o teste.
 *
 * O `defaultValue` em si — a garantia de que flag nao avaliada fica desligada — e
 * verificado no teste unitario da declaracao, nao aqui.
 *
 * E o mesmo mecanismo do Flags Explorer da Vercel. A diferenca e que aqui o
 * cookie e assinado pelo teste, e nao pelo Toolbar — que a CSP do projeto bloqueia
 * (ver SUC-19).
 */
export async function overrideFlags(context: BrowserContext, overrides: Record<string, boolean>): Promise<void> {
  const value = await encryptOverrides(overrides, E2E_FLAGS_SECRET);

  await context.addCookies([{ name: "vercel-flag-overrides", value, url: E2E_BASE_URL }]);
}
