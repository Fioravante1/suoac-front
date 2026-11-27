import { describe, expect, it } from "vitest";

import { isUnderPath } from "./shell-route";

describe("rota sob um caminho", () => {
  it.each(["/congregations", "/congregations/123"])("reconhece %s sob /congregations", (pathname) => {
    expect(isUnderPath(pathname, "/congregations")).toBe(true);
  });

  it("não confunde um prefixo de nome com subrota", () => {
    expect(isUnderPath("/congregationsx", "/congregations")).toBe(false);
  });
});
