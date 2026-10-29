import { describe, expect, it, vi } from "vitest";

const resolveSelectedEventAction = vi.hoisted(() => vi.fn());

vi.mock("../resolve-selected-event-action", () => ({ resolveSelectedEventAction }));

import { selectedEventOptions } from "./selected-event-options";

describe("selectedEventOptions", () => {
  it("guarda o evento selecionado sob as chaves de eventos do circuito", () => {
    expect(selectedEventOptions("circuit-1").queryKey).toEqual(["suoac", "events", "selected", "circuit-1"]);
  });

  it("resolve o evento pela Server Action", async () => {
    resolveSelectedEventAction.mockResolvedValue(null);

    await selectedEventOptions("circuit-1").queryFn();

    expect(resolveSelectedEventAction).toHaveBeenCalled();
  });

  it("só consulta com um circuito", () => {
    expect(selectedEventOptions("").enabled).toBe(false);
    expect(selectedEventOptions("circuit-1").enabled).toBe(true);
  });

  it("não lança a falha para o error boundary, para não derrubar o layout", () => {
    expect(selectedEventOptions("circuit-1").throwOnError).toBe(false);
  });
});
