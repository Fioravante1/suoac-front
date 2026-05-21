import { Home, Settings } from "lucide-react";
import { describe, expect, it } from "vitest";

import type { UserRole } from "../session";

import { filterNavItems, isCircuitRole, type NavItem } from "./rbac";

describe("isCircuitRole", () => {
  it("retorna true para CIRCUIT_COORDINATOR", () => {
    expect(isCircuitRole("CIRCUIT_COORDINATOR")).toBe(true);
  });

  it("retorna true para CIRCUIT_ASSISTANT", () => {
    expect(isCircuitRole("CIRCUIT_ASSISTANT")).toBe(true);
  });

  it("retorna false para CONGREGATION_COORDINATOR", () => {
    expect(isCircuitRole("CONGREGATION_COORDINATOR")).toBe(false);
  });

  it("retorna false para CONGREGATION_ASSISTANT", () => {
    expect(isCircuitRole("CONGREGATION_ASSISTANT")).toBe(false);
  });
});

describe("filterNavItems", () => {
  const allRoles: UserRole[] = [
    "CIRCUIT_COORDINATOR",
    "CIRCUIT_ASSISTANT",
    "CONGREGATION_COORDINATOR",
    "CONGREGATION_ASSISTANT",
  ];

  const publicItem: NavItem = { label: "Home", href: "/", icon: Home };
  const circuitOnlyItem: NavItem = {
    label: "Config",
    href: "/settings",
    icon: Settings,
    roles: ["CIRCUIT_COORDINATOR", "CIRCUIT_ASSISTANT"],
  };

  it("retorna todos os itens quando nenhum tem roles definido", () => {
    const items: NavItem[] = [publicItem, { label: "About", href: "/about", icon: Home }];

    for (const role of allRoles) {
      expect(filterNavItems(items, role)).toHaveLength(2);
    }
  });

  it("filtra itens cujo roles nao inclui o papel do usuario", () => {
    const items: NavItem[] = [publicItem, circuitOnlyItem];

    const result = filterNavItems(items, "CONGREGATION_COORDINATOR");

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Home");
  });

  it("mantem itens cujo roles inclui o papel do usuario", () => {
    const items: NavItem[] = [publicItem, circuitOnlyItem];

    const result = filterNavItems(items, "CIRCUIT_COORDINATOR");

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.label)).toEqual(["Home", "Config"]);
  });

  it("retorna lista vazia quando todos os itens sao restritos e o papel nao tem acesso", () => {
    const items: NavItem[] = [circuitOnlyItem];

    const result = filterNavItems(items, "CONGREGATION_ASSISTANT");

    expect(result).toHaveLength(0);
  });
});
