import { describe, expect, it } from "vitest";

import { findMenuItemToFocus } from "./menu-navigation";

function buildItems(): HTMLElement[] {
  return ["primeiro", "meio", "último"].map((label) => {
    const item = document.createElement("button");
    item.textContent = label;

    return item;
  });
}

describe("findMenuItemToFocus", () => {
  const items = buildItems();
  const [first, middle, last] = items;

  it("a seta para baixo vai ao próximo item e dá a volta no último", () => {
    expect(findMenuItemToFocus(items, first ?? null, "ArrowDown")).toBe(middle);
    expect(findMenuItemToFocus(items, last ?? null, "ArrowDown")).toBe(first);
  });

  it("a seta para cima vai ao item anterior e dá a volta no primeiro", () => {
    expect(findMenuItemToFocus(items, middle ?? null, "ArrowUp")).toBe(first);
    expect(findMenuItemToFocus(items, first ?? null, "ArrowUp")).toBe(last);
  });

  it("Home e End vão às pontas", () => {
    expect(findMenuItemToFocus(items, middle ?? null, "Home")).toBe(first);
    expect(findMenuItemToFocus(items, middle ?? null, "End")).toBe(last);
  });

  it("com o foco fora dos itens, a seta para baixo entra pelo primeiro e a para cima pelo último", () => {
    const outside = document.createElement("div");

    expect(findMenuItemToFocus(items, outside, "ArrowDown")).toBe(first);
    expect(findMenuItemToFocus(items, null, "ArrowUp")).toBe(last);
  });

  it("ignora as outras teclas", () => {
    expect(findMenuItemToFocus(items, first ?? null, "a")).toBeNull();
    expect(findMenuItemToFocus(items, first ?? null, "Enter")).toBeNull();
  });

  it("sem itens, não há para onde ir", () => {
    expect(findMenuItemToFocus([], null, "ArrowDown")).toBeNull();
    expect(findMenuItemToFocus([], null, "End")).toBeNull();
  });
});
