import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useServerError } from "./use-server-error";

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
});
