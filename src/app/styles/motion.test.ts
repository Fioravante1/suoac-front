import { describe, expect, it } from "vitest";

import {
  camelToKebab,
  extractBlock,
  extractDeclarations,
  extractDeclarationsOf,
  extractKeyframes,
  loadCss,
} from "@/shared/theme-testing";

import { themeTokens } from "./theme-tokens";

/**
 * As animacoes do redesign nao sao enfeite: o handoff especifica cada uma, e elas
 * se repetem em todas as telas. Este teste garante que o que esta em
 * `globals.css` continua sendo o que o handoff pediu.
 */
const globals = loadCss("app/globals.css");
const dashboardPrototype = loadCss("docs/design_handoff_suoac_redesign/SUOAC Dashboard.dc.html");
const loginPrototype = loadCss("docs/design_handoff_suoac_redesign/SUOAC Login.dc.html");

const ourKeyframes = extractKeyframes(globals);
const prototypeKeyframes = {
  dashboard: extractKeyframes(dashboardPrototype),
  login: extractKeyframes(loginPrototype),
};

type PrototypeName = keyof typeof prototypeKeyframes;

/**
 * Nome no design system → nome e protótipo de origem.
 *
 * A origem importa: os dois protótipos declaram animações **diferentes** com o
 * mesmo nome. `pop` no painel é o toast inferior centralizado; `pop` no login é o
 * check de sucesso do botão, que nem entra aqui — é específico daquela tela e
 * nasce na Fatia 1. E `rise` sobe 10px no painel contra 12px no login; o design
 * system adota o valor do painel, onde a animação aparece em dezenas de lugares.
 */
const KEYFRAMES_FROM_HANDOFF: ReadonlyArray<[string, string, PrototypeName]> = [
  ["suoac-rise", "rise", "dashboard"],
  ["suoac-fade", "fade", "dashboard"],
  ["suoac-modal-in", "popC2", "dashboard"],
  ["suoac-pop", "pop", "dashboard"],
  ["suoac-grow", "grow", "dashboard"],
  ["suoac-seat", "seat", "dashboard"],
  ["suoac-draw", "draw", "dashboard"],
  ["suoac-shake", "shake", "login"],
  ["suoac-spin", "spin", "login"],
];

describe("animações compartilhadas", () => {
  it.each(KEYFRAMES_FROM_HANDOFF)("declara %s", (name) => {
    expect(ourKeyframes.has(name)).toBe(true);
  });

  it.each(KEYFRAMES_FROM_HANDOFF)(
    "reproduz %s exatamente como o handoff especifica",
    (name, prototypeName, prototype) => {
      // O .dc.html é a fonte da verdade do design: divergir aqui é divergir do
      // que foi aprovado, não "ajustar".
      const specified = prototypeKeyframes[prototype].get(prototypeName);

      expect(specified).toBeDefined();
      expect(ourKeyframes.get(name)).toBe(specified);
    },
  );

  it("não adota o 'pop' do login, que é outra animação com o mesmo nome", () => {
    // Protege contra alguém "unificar" os dois por acharem que divergiram.
    expect(ourKeyframes.get("suoac-pop")).not.toBe(prototypeKeyframes.login.get("pop"));
  });

  it("usa o prefixo do design system, para não colidir com animação local de tela", () => {
    const globalNames = [...ourKeyframes.keys()];

    expect(globalNames.every((name) => name.startsWith("suoac-"))).toBe(true);
  });
});

describe("tokens de movimento", () => {
  const rootDeclarations = extractDeclarationsOf(globals, ":root");

  it("declara durações, curvas e escalonamento", () => {
    const motionTokens = [...rootDeclarations.keys()].filter((token) => token.startsWith("--suoac-motion-"));

    expect(motionTokens.sort()).toEqual(
      [
        "--suoac-motion-duration-fast",
        "--suoac-motion-duration-base",
        "--suoac-motion-duration-medium",
        "--suoac-motion-duration-slow",
        "--suoac-motion-theme",
        "--suoac-motion-ease-standard",
        "--suoac-motion-ease-overshoot",
        "--suoac-motion-stagger-step",
        "--suoac-motion-stagger-max",
      ].sort(),
    );
  });

  it("reflete no espelho TypeScript o que o CSS declara", () => {
    for (const [key, value] of Object.entries(themeTokens.motion.duration)) {
      expect(rootDeclarations.get(`--suoac-motion-duration-${camelToKebab(key)}`)).toBe(value);
    }

    for (const [key, value] of Object.entries(themeTokens.motion.ease)) {
      expect(rootDeclarations.get(`--suoac-motion-ease-${camelToKebab(key)}`)).toBe(value);
    }

    for (const [key, value] of Object.entries(themeTokens.motion.stagger)) {
      expect(rootDeclarations.get(`--suoac-motion-stagger-${camelToKebab(key)}`)).toBe(value);
    }
  });

  it("usa a curva dominante do handoff como padrão", () => {
    // 63 das 69 curvas do protótipo são esta; qualquer outra precisa de motivo.
    expect(themeTokens.motion.ease.standard).toBe("cubic-bezier(0.2, 0.8, 0.2, 1)");
  });

  it("deriva a transição de tema da escala, em vez de repetir o valor", () => {
    expect(rootDeclarations.get("--suoac-motion-theme")).toBe("var(--suoac-motion-duration-medium)");
  });
});

describe("preferência por menos movimento", () => {
  // A primeira media query de movimento reduzido no arquivo é a que ajusta os
  // tokens; a segunda, no fim, desliga a transição de tema do body.
  const reducedDeclarations = extractDeclarations(extractBlock(globals, "@media (prefers-reduced-motion: reduce)"));

  it("encurta as durações em vez de remover as animações", () => {
    // Remover a animação quebraria entradas declaradas com `both`/`forwards`,
    // que dependem do estado final do keyframe para ficarem visíveis.
    for (const token of [
      "--suoac-motion-duration-fast",
      "--suoac-motion-duration-base",
      "--suoac-motion-duration-medium",
      "--suoac-motion-duration-slow",
    ]) {
      expect(reducedDeclarations.get(token)).toBe("1ms");
    }
  });

  it("zera o escalonamento das listas", () => {
    expect(reducedDeclarations.get("--suoac-motion-stagger-step")).toBe("0ms");
    expect(reducedDeclarations.get("--suoac-motion-stagger-max")).toBe("0ms");
  });
});
