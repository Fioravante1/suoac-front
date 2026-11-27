import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useIsPanelDesktop } from "./use-is-panel-desktop";

describe("largura desktop do painel", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([true, false])("lê a largura atual %s e acompanha mudanças", (initial) => {
    const events = new EventTarget();
    const media = {
      matches: initial,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: vi.fn(events.removeEventListener.bind(events)),
    };
    const matchMedia = vi.fn(() => media);
    vi.stubGlobal("matchMedia", matchMedia);

    const { result, unmount } = renderHook(() => useIsPanelDesktop());

    expect(result.current).toBe(initial);
    expect(matchMedia).toHaveBeenCalledWith("(min-width: 80rem)");

    act(() => {
      media.matches = !initial;
      events.dispatchEvent(new Event("change"));
    });

    expect(result.current).toBe(!initial);
    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("não falha sem matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);

    expect(renderHook(() => useIsPanelDesktop()).result.current).toBe(false);
  });

  it("usa false no servidor mesmo com viewport desktop", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );
    function Probe() {
      return <span>{String(useIsPanelDesktop())}</span>;
    }

    expect(renderToString(<Probe />)).toBe("<span>false</span>");
  });
});
