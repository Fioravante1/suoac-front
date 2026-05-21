import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { usePagination } from "./use-pagination";

describe("usePagination", () => {
  it("inicia na pagina 1 por padrao", () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.page).toBe(1);
  });

  it("inicia na pagina informada", () => {
    const { result } = renderHook(() => usePagination(3));

    expect(result.current.page).toBe(3);
  });

  it("altera a pagina corretamente", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPage(5);
    });

    expect(result.current.page).toBe(5);
  });

  it("reseta para a pagina inicial", () => {
    const { result } = renderHook(() => usePagination(2));

    act(() => {
      result.current.setPage(10);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.page).toBe(2);
  });
});
