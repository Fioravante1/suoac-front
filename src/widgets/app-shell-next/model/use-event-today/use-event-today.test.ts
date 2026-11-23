import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useEventToday } from "./use-event-today";

describe("useEventToday", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("começa no dia de São Paulo", () => {
    vi.useFakeTimers({ now: new Date("2026-10-08T01:00:00.000Z") });

    const { result } = renderHook(() => useEventToday());

    expect(result.current).toBe("2026-10-07");
  });

  it("vira o dia sozinho depois da meia-noite de São Paulo", () => {
    vi.useFakeTimers({ now: new Date("2026-10-08T02:59:30.000Z") });

    const { result } = renderHook(() => useEventToday());

    expect(result.current).toBe("2026-10-07");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe("2026-10-08");
  });
});
