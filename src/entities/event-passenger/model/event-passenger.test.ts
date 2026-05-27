import { describe, expect, it } from "vitest";

import { PAYMENT_STATUSES, canManageEventPassengers } from "./event-passenger";

describe("canManageEventPassengers", () => {
  it("retorna true para evento OPEN", () => {
    expect(canManageEventPassengers("OPEN")).toBe(true);
  });

  it("retorna false para evento DRAFT", () => {
    expect(canManageEventPassengers("DRAFT")).toBe(false);
  });

  it("retorna false para evento CLOSED", () => {
    expect(canManageEventPassengers("CLOSED")).toBe(false);
  });

  it("retorna false para evento FINISHED", () => {
    expect(canManageEventPassengers("FINISHED")).toBe(false);
  });

  it("retorna false para evento CANCELLED", () => {
    expect(canManageEventPassengers("CANCELLED")).toBe(false);
  });
});

describe("PAYMENT_STATUSES", () => {
  it("contém os 4 status de pagamento", () => {
    expect(Object.keys(PAYMENT_STATUSES)).toEqual(["PENDING", "PARTIAL", "PAID", "EXEMPT"]);
  });
});
