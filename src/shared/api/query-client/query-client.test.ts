import { describe, it, expect, vi, beforeEach } from "vitest";

import { SESSION_EXPIRED_MESSAGE } from "@/shared/auth/constants";
import { resetSessionRedirect } from "@/shared/auth/session-redirect";

import { createQueryClient } from "./query-client";

const mockLocationHref = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  resetSessionRedirect();

  Object.defineProperty(window, "location", {
    value: {
      pathname: "/congregations",
      search: "?page=2",
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

describe("query-client handleAuthError", () => {
  it("redireciona para login quando erro tem SESSION_EXPIRED_MESSAGE", () => {
    const client = createQueryClient();
    const cache = client.getQueryCache();

    cache.config.onError?.(new Error(SESSION_EXPIRED_MESSAGE), undefined!);

    expect(mockLocationHref).toHaveBeenCalledWith("/login?sessionExpired=true&returnUrl=%2Fcongregations%3Fpage%3D2");
  });

  it("nao redireciona para outros erros", () => {
    const client = createQueryClient();
    const cache = client.getQueryCache();

    cache.config.onError?.(new Error("Internal server error"), undefined!);

    expect(mockLocationHref).not.toHaveBeenCalled();
  });

  it("so redireciona uma vez (gate isRedirecting)", () => {
    const client = createQueryClient();
    const cache = client.getQueryCache();

    cache.config.onError?.(new Error(SESSION_EXPIRED_MESSAGE), undefined!);
    cache.config.onError?.(new Error(SESSION_EXPIRED_MESSAGE), undefined!);

    expect(mockLocationHref).toHaveBeenCalledTimes(1);
  });
});

describe("query-client throwOnError", () => {
  it("propaga erros genericos para o error boundary", () => {
    const client = createQueryClient();
    const throwOnError = client.getDefaultOptions().queries?.throwOnError;

    expect(typeof throwOnError).toBe("function");

    if (typeof throwOnError === "function") {
      const result = throwOnError(new Error("Internal server error"), undefined!);
      expect(result).toBe(true);
    }
  });

  it("nao propaga erro de sessao expirada para o error boundary", () => {
    const client = createQueryClient();
    const throwOnError = client.getDefaultOptions().queries?.throwOnError;

    if (typeof throwOnError === "function") {
      const result = throwOnError(new Error(SESSION_EXPIRED_MESSAGE), undefined!);
      expect(result).toBe(false);
    }
  });
});

describe("query-client retry", () => {
  it("desabilita retry para erro de sessao expirada", () => {
    const client = createQueryClient();
    const retryFn = client.getDefaultOptions().queries?.retry;

    expect(typeof retryFn).toBe("function");

    if (typeof retryFn === "function") {
      const result = retryFn(0, new Error(SESSION_EXPIRED_MESSAGE));
      expect(result).toBe(false);
    }
  });

  it("permite retry para outros erros dentro do limite", () => {
    const client = createQueryClient();
    const retryFn = client.getDefaultOptions().queries?.retry;

    if (typeof retryFn === "function") {
      expect(retryFn(0, new Error("Network error"))).toBe(true);
      expect(retryFn(1, new Error("Network error"))).toBe(false);
    }
  });
});
