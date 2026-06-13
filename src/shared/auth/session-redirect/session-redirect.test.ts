import { describe, it, expect, vi, beforeEach } from "vitest";

import { SESSION_EXPIRED_MESSAGE } from "../constants";

import { isSessionExpiredError, redirectToSessionExpired, resetSessionRedirect } from "./session-redirect";

const mockLocationHref = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  resetSessionRedirect();

  Object.defineProperty(window, "location", {
    value: {
      pathname: "/passengers",
      search: "?page=3",
      get href() {
        return `${this.pathname}${this.search}`;
      },
      set href(url: string) {
        mockLocationHref(url);
      },
    },
    writable: true,
  });
});

describe("isSessionExpiredError", () => {
  it("reconhece Error com mensagem de sessão expirada (caminho de query)", () => {
    expect(isSessionExpiredError(new Error(SESSION_EXPIRED_MESSAGE))).toBe(true);
  });

  it("reconhece a mensagem como string (caminho de mutation/ActionResult)", () => {
    expect(isSessionExpiredError(SESSION_EXPIRED_MESSAGE)).toBe(true);
  });

  it("ignora outros erros e valores vazios", () => {
    expect(isSessionExpiredError(new Error("Outro erro"))).toBe(false);
    expect(isSessionExpiredError("falha qualquer")).toBe(false);
    expect(isSessionExpiredError(null)).toBe(false);
    expect(isSessionExpiredError(undefined)).toBe(false);
  });
});

describe("redirectToSessionExpired", () => {
  it("redireciona para /login com sessionExpired e returnUrl", () => {
    redirectToSessionExpired();

    expect(mockLocationHref).toHaveBeenCalledWith("/login?sessionExpired=true&returnUrl=%2Fpassengers%3Fpage%3D3");
  });

  it("dispara apenas uma vez (gate isRedirecting)", () => {
    redirectToSessionExpired();
    redirectToSessionExpired();

    expect(mockLocationHref).toHaveBeenCalledTimes(1);
  });
});
