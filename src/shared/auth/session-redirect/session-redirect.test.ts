import { describe, it, expect, vi, beforeEach } from "vitest";

import { SESSION_EXPIRED_MESSAGE, PASSWORD_CHANGE_REQUIRED_MESSAGE } from "../constants";

import {
  isSessionExpiredError,
  redirectToSessionExpired,
  isPasswordChangeRequiredError,
  redirectToPasswordChangeRequired,
  resetSessionRedirect,
  subscribeToSessionRedirect,
} from "./session-redirect";

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

describe("isPasswordChangeRequiredError", () => {
  it("reconhece a mensagem de troca obrigatória (Error e string)", () => {
    expect(isPasswordChangeRequiredError(new Error(PASSWORD_CHANGE_REQUIRED_MESSAGE))).toBe(true);
    expect(isPasswordChangeRequiredError(PASSWORD_CHANGE_REQUIRED_MESSAGE)).toBe(true);
  });

  it("ignora outros erros", () => {
    expect(isPasswordChangeRequiredError(new Error(SESSION_EXPIRED_MESSAGE))).toBe(false);
    expect(isPasswordChangeRequiredError("Forbidden")).toBe(false);
    expect(isPasswordChangeRequiredError(null)).toBe(false);
  });
});

describe("redirectToPasswordChangeRequired", () => {
  it("redireciona para /change-password", () => {
    redirectToPasswordChangeRequired();

    expect(mockLocationHref).toHaveBeenCalledWith("/change-password");
  });

  it("compartilha o gate com o redirect de sessão (dispara uma vez)", () => {
    redirectToPasswordChangeRequired();
    redirectToSessionExpired();

    expect(mockLocationHref).toHaveBeenCalledTimes(1);
  });
});

describe("subscribeToSessionRedirect", () => {
  it("notifica o listener quando o redirect dispara", () => {
    const listener = vi.fn();
    subscribeToSessionRedirect(listener);

    redirectToSessionExpired();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("não notifica chamadas bloqueadas pelo gate", () => {
    const listener = vi.fn();
    subscribeToSessionRedirect(listener);

    redirectToSessionExpired();
    redirectToSessionExpired();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("não notifica após o unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSessionRedirect(listener);

    unsubscribe();
    redirectToSessionExpired();

    expect(listener).not.toHaveBeenCalled();
  });
});
