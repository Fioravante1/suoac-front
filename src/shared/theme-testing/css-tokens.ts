import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Leitura de design tokens direto do CSS, para testes.
 *
 * O projeto mantem os tokens em CSS e no espelho TypeScript, e tokens globais
 * nao sao observaveis por `jsdom` (que nao resolve `var()` nem aplica folhas de
 * estilo externas). Ler e resolver o CSS aqui e o que permite testar, de fato,
 * que os temas estao completos e coerentes entre si.
 */

export function loadCss(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

/** Recorta o conteudo de um bloco pelo seletor, respeitando chaves aninhadas. */
export function extractBlock(css: string, selector: string): string {
  const selectorIndex = css.indexOf(`${selector} {`);

  if (selectorIndex === -1) {
    throw new Error(`Seletor nao encontrado no CSS: ${selector}`);
  }

  const blockStart = css.indexOf("{", selectorIndex);
  let depth = 0;

  for (let index = blockStart; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(blockStart + 1, index);
    }
  }

  throw new Error(`Bloco sem fechamento no CSS: ${selector}`);
}

/** Mapeia as custom properties declaradas num bloco. */
export function extractDeclarations(block: string): Map<string, string> {
  const withoutComments = block.replace(/\/\*[\s\S]*?\*\//g, "");
  const declarations = new Map<string, string>();

  for (const chunk of withoutComments.split(";")) {
    const declaration = chunk.match(/(--[\w-]+)\s*:\s*([\s\S]+)/);
    if (declaration) declarations.set(declaration[1], declaration[2].trim().replace(/\s+/g, " "));
  }

  return declarations;
}

export function extractDeclarationsOf(css: string, selector: string): Map<string, string> {
  return extractDeclarations(extractBlock(css, selector));
}

export interface TokenResolver {
  /** Valor final do token no tema, com `var()` ja resolvido. */
  (token: string): string;
}

/**
 * Cria um leitor de tokens para um tema.
 *
 * `inherited` representa o que o tema herda de onde nao sobrescreve — tipicamente
 * o `:root`. Resolver `var()` manualmente e necessario porque varios tokens sao
 * apelidos (`--suoac-color-sidebar: var(--suoac-color-navy)`) e so comparar o
 * texto declarado nao diria se a cor final mudou.
 */
export function createTokenResolver(
  declarations: Map<string, string>,
  inherited: Map<string, string> = new Map(),
): TokenResolver {
  function resolve(value: string, visited: Set<string>): string {
    const reference = value.match(/^var\((--[\w-]+)\)$/);
    if (!reference) return value.toLowerCase();

    const token = reference[1];
    if (visited.has(token)) throw new Error(`Ciclo de var() em ${token}`);
    visited.add(token);

    const next = declarations.get(token) ?? inherited.get(token);
    if (next === undefined) throw new Error(`Token referenciado mas nao declarado: ${token}`);

    return resolve(next, visited);
  }

  return (token: string) => {
    const declared = declarations.get(token) ?? inherited.get(token);
    if (declared === undefined) throw new Error(`Token nao declarado: ${token}`);
    return resolve(declared, new Set());
  };
}

export function camelToKebab(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Mapeia os `@keyframes` declarados num CSS, com o corpo normalizado (sem espacos
 * supérfluos), para que a mesma animacao escrita em formatacoes diferentes possa
 * ser comparada.
 */
export function extractKeyframes(css: string): Map<string, string> {
  const keyframes = new Map<string, string>();
  const pattern = /@keyframes\s+([\w-]+)\s*\{/g;

  for (const match of css.matchAll(pattern)) {
    const blockStart = match.index + match[0].length - 1;
    let depth = 0;

    for (let index = blockStart; index < css.length; index += 1) {
      if (css[index] === "{") depth += 1;
      if (css[index] === "}") {
        depth -= 1;
        if (depth === 0) {
          keyframes.set(match[1], normalizeKeyframeBody(css.slice(blockStart + 1, index)));
          break;
        }
      }
    }
  }

  return keyframes;
}

function normalizeKeyframeBody(body: string): string {
  return body
    .replace(/\s+/g, "")
    .replace(/;}/g, "}")
    .replace(/0\.(\d)/g, ".$1")
    .toLowerCase();
}
