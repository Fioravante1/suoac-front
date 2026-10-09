import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { darkThemeTokens, lightThemeTokens, themeTokens, type ThemeVariant } from "./theme-tokens";

/**
 * O projeto mantem os tokens em dois lugares: `app/globals.css` (consumido pelos
 * CSS Modules) e este modulo (consumido por TypeScript). Fonte de verdade dupla
 * so e segura se algo garantir que as duas nao divirjam — e esse algo e este
 * teste.
 */
const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

const SELETOR_CLARO = ":root";
const SELETOR_ESCURO_EXPLICITO = 'html[data-theme="dark"]';
const SELETOR_ESCURO_SISTEMA = 'html[data-theme="system"]';

/**
 * Cores cujo valor e deliberadamente o mesmo nos dois temas. Qualquer outra cor
 * precisa de par escuro — ver `darkThemeTokens`.
 */
const CORES_IGUAIS_NOS_DOIS_TEMAS = [
  // Branco sobre navy e sobre a cor primaria do tema claro.
  "--suoac-color-text-inverse",
  // O handoff define um unico scrim de modal.
  "--suoac-color-modal-scrim",
];

function extrairBloco(seletor: string): string {
  const inicioSeletor = css.indexOf(`${seletor} {`);

  if (inicioSeletor === -1) {
    throw new Error(`Seletor nao encontrado em app/globals.css: ${seletor}`);
  }

  const abertura = css.indexOf("{", inicioSeletor);
  let nivel = 0;

  for (let i = abertura; i < css.length; i += 1) {
    if (css[i] === "{") nivel += 1;
    if (css[i] === "}") {
      nivel -= 1;
      if (nivel === 0) return css.slice(abertura + 1, i);
    }
  }

  throw new Error(`Bloco sem fechamento em app/globals.css: ${seletor}`);
}

function extrairDeclaracoes(bloco: string): Map<string, string> {
  const semComentarios = bloco.replace(/\/\*[\s\S]*?\*\//g, "");
  const declaracoes = new Map<string, string>();

  for (const trecho of semComentarios.split(";")) {
    const par = trecho.match(/(--[\w-]+)\s*:\s*([\s\S]+)/);
    if (par) declaracoes.set(par[1], par[2].trim().replace(/\s+/g, " "));
  }

  return declaracoes;
}

const declaracoesClaro = extrairDeclaracoes(extrairBloco(SELETOR_CLARO));
const declaracoesEscuroExplicito = extrairDeclaracoes(extrairBloco(SELETOR_ESCURO_EXPLICITO));
const declaracoesEscuroSistema = extrairDeclaracoes(extrairBloco(SELETOR_ESCURO_SISTEMA));

/** Resolve `var(--x)` ate chegar a um valor literal, como o navegador faria. */
function resolverValor(valor: string, tema: Map<string, string>, visitados = new Set<string>()): string {
  const referencia = valor.match(/^var\((--[\w-]+)\)$/);
  if (!referencia) return valor.toLowerCase();

  const nome = referencia[1];
  if (visitados.has(nome)) throw new Error(`Ciclo de var() em ${nome}`);
  visitados.add(nome);

  const proximo = tema.get(nome) ?? declaracoesClaro.get(nome);
  if (proximo === undefined) throw new Error(`Token referenciado mas nao declarado: ${nome}`);

  return resolverValor(proximo, tema, visitados);
}

function valorNoTema(nome: string, tema: Map<string, string>): string {
  const declarado = tema.get(nome) ?? declaracoesClaro.get(nome);
  if (declarado === undefined) throw new Error(`Token nao declarado: ${nome}`);
  return resolverValor(declarado, tema);
}

function camelParaKebab(chave: string): string {
  return chave.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);
}

const nomesDeCorDoTemaClaro = [...declaracoesClaro.keys()].filter((nome) => nome.startsWith("--suoac-color-"));
const nomesDeSombraDoTemaClaro = [...declaracoesClaro.keys()].filter((nome) => nome.startsWith("--suoac-shadow-"));

describe("tema escuro no globals.css", () => {
  it("declara os mesmos tokens na escolha explicita e na preferencia do sistema", () => {
    expect([...declaracoesEscuroSistema.keys()].sort()).toEqual([...declaracoesEscuroExplicito.keys()].sort());
  });

  it("declara os mesmos valores nos dois seletores", () => {
    expect(Object.fromEntries(declaracoesEscuroSistema)).toEqual(Object.fromEntries(declaracoesEscuroExplicito));
  });

  it("da par escuro a toda cor do tema claro", () => {
    const semPar = nomesDeCorDoTemaClaro.filter((nome) => {
      if (CORES_IGUAIS_NOS_DOIS_TEMAS.includes(nome)) return false;
      return valorNoTema(nome, declaracoesEscuroExplicito) === valorNoTema(nome, declaracoesClaro);
    });

    expect(semPar).toEqual([]);
  });

  it("da par escuro a toda sombra do tema claro", () => {
    const semPar = nomesDeSombraDoTemaClaro.filter(
      (nome) => valorNoTema(nome, declaracoesEscuroExplicito) === valorNoTema(nome, declaracoesClaro),
    );

    expect(semPar).toEqual([]);
  });

  it("so aplica o tema escuro mediante opt-in explicito", () => {
    const seletoresSobPreferenciaDoSistema = [
      ...css.matchAll(/@media \(prefers-color-scheme: dark\) \{\s*([^{]+)\{/g),
    ].map((ocorrencia) => ocorrencia[1].trim());

    expect(seletoresSobPreferenciaDoSistema).toEqual(['html[data-theme="system"]']);
  });

  it("troca o color-scheme, para que controles nativos acompanhem o tema", () => {
    expect(extrairBloco(SELETOR_ESCURO_EXPLICITO)).toContain("color-scheme: dark");
    expect(extrairBloco(SELETOR_ESCURO_SISTEMA)).toContain("color-scheme: dark");
  });
});

describe("espelho TypeScript dos tokens", () => {
  const temas: ReadonlyArray<[string, ThemeVariant, Map<string, string>]> = [
    ["claro", lightThemeTokens, declaracoesClaro],
    ["escuro", darkThemeTokens, declaracoesEscuroExplicito],
  ];

  it.each(temas)("reflete as cores do tema %s declaradas no CSS", (_nome, tokens, declaracoes) => {
    for (const [chave, valor] of Object.entries(tokens.color)) {
      expect(valorNoTema(`--suoac-color-${camelParaKebab(chave)}`, declaracoes)).toBe(valor.toLowerCase());
    }
  });

  it.each(temas)("reflete as sombras do tema %s declaradas no CSS", (_nome, tokens, declaracoes) => {
    for (const [chave, valor] of Object.entries(tokens.shadow)) {
      expect(valorNoTema(`--suoac-shadow-${camelParaKebab(chave)}`, declaracoes)).toBe(valor.toLowerCase());
    }
  });

  it.each(temas)("reflete os estados de evento e pagamento do tema %s", (_nome, tokens, declaracoes) => {
    for (const [chave, valor] of Object.entries(tokens.event)) {
      expect(valorNoTema(`--suoac-color-event-${camelParaKebab(chave)}`, declaracoes)).toBe(valor.toLowerCase());
    }

    for (const [chave, valor] of Object.entries(tokens.payment)) {
      expect(valorNoTema(`--suoac-color-payment-${camelParaKebab(chave)}`, declaracoes)).toBe(valor.toLowerCase());
    }
  });

  it("cobre no tema escuro toda cor declarada no CSS", () => {
    const nomesEsperados = nomesDeCorDoTemaClaro
      .filter((nome) => !nome.startsWith("--suoac-color-event-") && !nome.startsWith("--suoac-color-payment-"))
      .sort();
    const nomesDoEspelho = Object.keys(darkThemeTokens.color)
      .map((chave) => `--suoac-color-${camelParaKebab(chave)}`)
      .sort();

    expect(nomesDoEspelho).toEqual(nomesEsperados);
  });

  it("mantem fora do tema escuro o que nao muda entre temas", () => {
    expect(themeTokens.typography.fontSize.body).toBe("1rem");
    expect(themeTokens.radius.xl).toBe("20px");
    expect(themeTokens.zIndex.modal).toBe(100);
  });
});
