import { beforeEach, describe, expect, it, vi } from "vitest";

import { hardNavigate } from "./hard-navigation";

const assignHref = vi.fn();

beforeEach(() => {
  assignHref.mockClear();

  Object.defineProperty(window, "location", {
    value: {
      origin: "https://suoac.com",
      pathname: "/events",
      search: "",
      get href() {
        return `${this.origin}${this.pathname}`;
      },
      set href(url: string) {
        assignHref(url);
      },
    },
    writable: true,
  });
});

describe("hardNavigate", () => {
  it("navega para a URL absoluta do caminho, na mesma origem", () => {
    hardNavigate("/login");

    expect(assignHref).toHaveBeenCalledWith("https://suoac.com/login");
  });

  it("preserva a query string do caminho", () => {
    hardNavigate("/login?sessionExpired=true&returnUrl=%2Fpassengers%3Fpage%3D3");

    expect(assignHref).toHaveBeenCalledWith(
      "https://suoac.com/login?sessionExpired=true&returnUrl=%2Fpassengers%3Fpage%3D3",
    );
  });

  it("navega para a raiz", () => {
    hardNavigate("/");

    expect(assignHref).toHaveBeenCalledWith("https://suoac.com/");
  });

  it.each(["//evil.example/login", "https://evil.example/login", "javascript:alert(1)"])(
    "ignora %s, que não é um caminho do próprio site",
    (address) => {
      // Defesa em profundidade: os chamadores passam caminhos fixos, mas um valor
      // montado a partir de entrada de usuario nao pode virar redirecionamento aberto.
      hardNavigate(address);

      expect(assignHref).not.toHaveBeenCalled();
    },
  );
});
