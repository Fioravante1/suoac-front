import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "./use-debounced-value";

describe("useDebouncedValue", () => {
  it("retorna o valor inicial imediatamente", () => {
    const { result } = renderHook(() => useDebouncedValue("hello"));

    expect(result.current).toBe("hello");
  });

  it("não atualiza o valor antes do delay", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe("a");

    vi.useRealTimers();
  });

  it("atualiza o valor após o delay", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("ab");

    vi.useRealTimers();
  });

  it("reseta o timer quando o valor muda antes do delay", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "abc" });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe("abc");

    vi.useRealTimers();
  });

  it("usa delay padrão de 300ms", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
      initialProps: { value: "x" },
    });

    rerender({ value: "xy" });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(result.current).toBe("x");

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current).toBe("xy");

    vi.useRealTimers();
  });
});
