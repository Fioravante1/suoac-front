import { describe, expect, it } from "vitest";

import { USER_ROLES } from "@/shared/auth";

import { getEventTabs, isEventTabActive } from "./event-tabs";

describe("getEventTabs", () => {
  it("segue a ordem e os nomes do v3, cada aba com a sua rota", () => {
    expect(getEventTabs("event-1", USER_ROLES.CIRCUIT_COORDINATOR).map(({ label, href }) => [label, href])).toEqual([
      ["Visão geral", "/dashboard"],
      ["Passageiros", "/events/event-1#inscricoes"],
      ["Financeiro", "/financial"],
      ["Congregações", "/congregations"],
      ["Ônibus", "/buses"],
      ["Listas e exportações", "/lists"],
    ]);
  });

  it("leva Passageiros aos inscritos do evento selecionado e a marca ativa no detalhe dele", () => {
    const passengers = getEventTabs("event-1", USER_ROLES.CIRCUIT_COORDINATOR).find(
      (tab) => tab.label === "Passageiros",
    );

    expect(passengers?.path).toBe("/events/event-1");
    expect(passengers && isEventTabActive(passengers, "/events/event-1")).toBe(true);
    expect(passengers && isEventTabActive(passengers, "/events/event-2")).toBe(false);
  });
});

describe("isEventTabActive", () => {
  const congregations = { path: "/congregations" };

  it("ativa a aba na própria rota", () => {
    expect(isEventTabActive(congregations, "/congregations")).toBe(true);
  });

  it("ativa a aba nas subrotas", () => {
    expect(isEventTabActive(congregations, "/congregations/123")).toBe(true);
  });

  it("não ativa a aba numa rota que só começa com o mesmo nome", () => {
    expect(isEventTabActive(congregations, "/congregations-archive")).toBe(false);
  });

  it("não ativa a aba em outra rota", () => {
    expect(isEventTabActive(congregations, "/financial")).toBe(false);
  });

  it.each([USER_ROLES.CONGREGATION_COORDINATOR, USER_ROLES.CONGREGATION_ASSISTANT] as const)(
    "navegação restrita para %s",
    (role) => {
      const items = getEventTabs("e1", role);
      expect(items.map((item) => item.label)).toContain("Pagamentos");
      expect(items.some((item) => item.label === "Equipe")).toBe(role === USER_ROLES.CONGREGATION_COORDINATOR);
      expect(items.some((item) => item.label === "Congregações")).toBe(false);
    },
  );
});
