import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useModal } from "./use-modal";

interface TestItem {
  id: string;
  name: string;
}

describe("useModal", () => {
  it("inicia fechado e sem item", () => {
    const { result } = renderHook(() => useModal<TestItem>());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.item).toBeNull();
  });

  it("abre sem item quando chamado sem argumento", () => {
    const { result } = renderHook(() => useModal<TestItem>());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.item).toBeNull();
  });

  it("abre com item quando chamado com argumento", () => {
    const { result } = renderHook(() => useModal<TestItem>());
    const item = { id: "1", name: "Teste" };

    act(() => {
      result.current.open(item);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.item).toEqual(item);
  });

  it("limpa estado ao fechar", () => {
    const { result } = renderHook(() => useModal<TestItem>());
    const item = { id: "1", name: "Teste" };

    act(() => {
      result.current.open(item);
    });

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.item).toBeNull();
  });
});
