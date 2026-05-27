import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePassengerSearch } from "./use-passenger-search";

describe("usePassengerSearch", () => {
  it("inicia busca vazia na primeira pagina", () => {
    const { result } = renderHook(() => usePassengerSearch());

    expect(result.current.searchTerm).toBe("");
    expect(result.current.searchPage).toBe(1);
    expect(result.current.hasSearch).toBe(false);
  });

  it("habilita busca com pelo menos dois caracteres úteis", () => {
    const { result } = renderHook(() => usePassengerSearch());

    act(() => {
      result.current.updateSearchTerm(" João ");
    });

    expect(result.current.searchTerm).toBe(" João ");
    expect(result.current.hasSearch).toBe(true);
  });

  it("reseta pagina ao alterar termo de busca", () => {
    const { result } = renderHook(() => usePassengerSearch());

    act(() => {
      result.current.setSearchPage(3);
    });

    act(() => {
      result.current.updateSearchTerm("Ma");
    });

    expect(result.current.searchPage).toBe(1);
  });

  it("limpa termo e pagina ao resetar busca", () => {
    const { result } = renderHook(() => usePassengerSearch());

    act(() => {
      result.current.updateSearchTerm("Maria");
      result.current.setSearchPage(4);
    });

    act(() => {
      result.current.resetSearch();
    });

    expect(result.current.searchTerm).toBe("");
    expect(result.current.searchPage).toBe(1);
    expect(result.current.hasSearch).toBe(false);
  });
});
