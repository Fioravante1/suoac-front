import { describe, expect, it } from "vitest";

import { USER_ROLES } from "@/shared/auth";

import { MORE_SCREENS, PANEL_NAV_IDS, getPanelNavItems, isPanelNavItemActive, isStackedScreen } from "./panel-nav";

function item(id: string, eventId: string | null = "event-1") {
  const found = getPanelNavItems(eventId, USER_ROLES.CIRCUIT_COORDINATOR).find((navItem) => navItem.id === id);

  if (!found) throw new Error(`item ${id} não existe`);

  return found;
}

describe("getPanelNavItems", () => {
  it("segue a ordem do desenho: Início, Passageiros, Financeiro e Mais", () => {
    expect(getPanelNavItems("event-1", USER_ROLES.CIRCUIT_COORDINATOR).map((navItem) => navItem.label)).toEqual([
      "Início",
      "Passageiros",
      "Financeiro",
      "Mais",
    ]);
  });

  it("leva Passageiros aos inscritos do evento selecionado, como a aba do desktop", () => {
    expect(item(PANEL_NAV_IDS.PASSENGERS).href).toBe("/events/event-1#inscricoes");
  });

  it("sem evento, leva Passageiros ao cadastro do circuito", () => {
    expect(item(PANEL_NAV_IDS.PASSENGERS, null).href).toBe("/passengers");
  });

  it("leva Início, Financeiro e Mais às rotas deles", () => {
    expect([PANEL_NAV_IDS.HOME, PANEL_NAV_IDS.FINANCIAL, PANEL_NAV_IDS.MORE].map((id) => item(id).href)).toEqual([
      "/dashboard",
      "/financial",
      "/more",
    ]);
  });
});

describe("isPanelNavItemActive", () => {
  it("marca o item pela rota e pelas subrotas", () => {
    expect(isPanelNavItemActive(item(PANEL_NAV_IDS.FINANCIAL), "/financial")).toBe(true);
    expect(isPanelNavItemActive(item(PANEL_NAV_IDS.FINANCIAL), "/financial/resumo")).toBe(true);
    expect(isPanelNavItemActive(item(PANEL_NAV_IDS.FINANCIAL), "/financial-extra")).toBe(false);
  });

  it("marca Passageiros nos inscritos do evento e no cadastro do circuito", () => {
    const passengers = item(PANEL_NAV_IDS.PASSENGERS);

    expect(isPanelNavItemActive(passengers, "/events/event-1")).toBe(true);
    expect(isPanelNavItemActive(passengers, "/passengers")).toBe(true);
    expect(isPanelNavItemActive(passengers, "/events/event-2")).toBe(false);
  });

  it("deixa Mais ativo nas telas empilhadas atrás dele", () => {
    const more = item(PANEL_NAV_IDS.MORE);

    expect(MORE_SCREENS.map((screen) => isPanelNavItemActive(more, screen.href))).toEqual([true, true, true]);
    expect(isPanelNavItemActive(more, "/more")).toBe(true);
    expect(isPanelNavItemActive(more, "/dashboard")).toBe(false);
  });
});

describe("isStackedScreen", () => {
  it("vale para Ônibus, Congregações e Listas, não para a própria tela Mais", () => {
    expect(["/buses", "/congregations", "/lists", "/congregations/123"].map(isStackedScreen)).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(["/more", "/dashboard", "/passengers"].map(isStackedScreen)).toEqual([false, false, false]);
  });

  it.each([USER_ROLES.CONGREGATION_COORDINATOR, USER_ROLES.CONGREGATION_ASSISTANT] as const)(
    "navegação restrita para %s",
    (role) => {
      const items = getPanelNavItems("e1", role);
      expect(items.map((item) => item.label)).toContain("Pagamentos");
      expect(items.some((item) => item.label === "Equipe")).toBe(role === USER_ROLES.CONGREGATION_COORDINATOR);
      expect(items.some((item) => item.label === "Congregações")).toBe(false);
    },
  );
});
