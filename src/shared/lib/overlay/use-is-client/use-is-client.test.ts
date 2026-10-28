import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { useIsClient } from "./use-is-client";

describe("useIsClient", () => {
  it("é verdadeiro no navegador", () => {
    const { result } = renderHook(() => useIsClient());

    expect(result.current).toBe(true);
  });

  it("é falso na renderização do servidor", () => {
    function Probe() {
      return createElement("span", null, String(useIsClient()));
    }

    expect(renderToString(createElement(Probe))).toContain("false");
  });
});
