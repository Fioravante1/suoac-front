import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { SESSION_EXPIRED_MESSAGE } from "@/shared/auth/constants";
import { resetSessionRedirect } from "@/shared/auth/session-redirect";

import { useServerError } from "./use-server-error";

const mockLocationHref = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  resetSessionRedirect();

  Object.defineProperty(window, "location", {
    value: {
      pathname: "/financial",
      search: "",
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

describe("useServerError", () => {
  it("inicia sem erro", () => {
    const { result } = renderHook(() => useServerError());

    expect(result.current.serverError).toBeNull();
  });

  it("exibe a mensagem recebida", () => {
    const { result } = renderHook(() => useServerError());

    act(() => {
      result.current.showServerError("Não foi possível salvar.");
    });

    expect(result.current.serverError).toBe("Não foi possível salvar.");
  });

  it("usa fallback quando a mensagem recebida está vazia", () => {
    const { result } = renderHook(() => useServerError());

    act(() => {
      result.current.showServerError("   ", "Tente novamente.");
    });

    expect(result.current.serverError).toBe("Tente novamente.");
  });

  it("limpa o erro atual", () => {
    const { result } = renderHook(() => useServerError());

    act(() => {
      result.current.showServerError("Erro temporário.");
    });

    act(() => {
      result.current.clearServerError();
    });

    expect(result.current.serverError).toBeNull();
  });

  it("redireciona para login em sessão expirada e não exibe a mensagem inline", () => {
    const { result } = renderHook(() => useServerError());

    act(() => {
      result.current.showServerError(SESSION_EXPIRED_MESSAGE);
    });

    expect(mockLocationHref).toHaveBeenCalledWith(expect.stringContaining("/login?sessionExpired=true"));
    expect(result.current.serverError).toBeNull();
  });
});
