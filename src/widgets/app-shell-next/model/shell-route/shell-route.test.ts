import { describe, expect, it } from "vitest";

import { isRedesignedRoute, isUnderPath } from "./shell-route";

describe("rota sob um caminho", () => {
  it.each(["/congregations", "/congregations/123"])("reconhece %s sob /congregations", (pathname) => {
    expect(isUnderPath(pathname, "/congregations")).toBe(true);
  });

  it("não confunde um prefixo de nome com subrota", () => {
    expect(isUnderPath("/congregationsx", "/congregations")).toBe(false);
  });
});

describe("contenção do conteúdo legado", () => {
  it.each(["/more", "/more/profile"])("deixa %s no tema escolhido", (route) => {
    expect(isRedesignedRoute(route)).toBe(true);
  });

  it.each([null, "/dashboard", "/financial", "/passengers", "/moreish", "/team"])(
    "mantém %s contido em claro",
    (route) => {
      expect(isRedesignedRoute(route)).toBe(false);
    },
  );
});
