import { afterEach, describe, expect, it } from "vitest";

import { type Layer, registerLayer } from "./layer-stack";

// A pilha é do módulo: uma camada esquecida aberta contaminaria os testes seguintes.
const openedInTest: Layer[] = [];

function open(depth = 0): Layer {
  const layer = registerLayer(depth);
  openedInTest.push(layer);

  return layer;
}

afterEach(() => {
  openedInTest.splice(0).forEach((layer) => layer.release());
});

describe("registerLayer", () => {
  it("põe a camada recém-aberta no topo", () => {
    const outer = open();
    const inner = open();

    expect(inner.isTopmost()).toBe(true);
    expect(outer.isTopmost()).toBe(false);
  });

  it("devolve o topo à camada de baixo quando a de cima fecha", () => {
    const outer = open();
    const inner = open();

    inner.release();

    expect(outer.isTopmost()).toBe(true);
  });

  it("mantém o topo quando a de baixo fecha primeiro", () => {
    const outer = open();
    const inner = open();

    outer.release();

    expect(inner.isTopmost()).toBe(true);
  });

  it("põe no topo a camada mais aninhada, mesmo registrada antes", () => {
    // Modal e modal de dentro abrindo juntos: o React roda o efeito do de dentro primeiro.
    const inner = open(1);
    const outer = open(0);

    expect(inner.isTopmost()).toBe(true);
    expect(outer.isTopmost()).toBe(false);
  });

  it("ignora a segunda chamada de quem já fechou", () => {
    const outer = open();
    const middle = open();
    const inner = open();

    middle.release();
    middle.release();

    expect(inner.isTopmost()).toBe(true);
    inner.release();
    expect(outer.isTopmost()).toBe(true);
  });
});
