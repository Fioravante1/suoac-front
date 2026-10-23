import { describe, expect, it } from "vitest";

import { DECLINE_REASONS, DECLINE_REASON_LABELS, isDeclineReason } from "./decline-reasons";

describe("DECLINE_REASONS", () => {
  it("usa os valores que o back aceita, na ordem da tela", () => {
    expect(Object.values(DECLINE_REASONS)).toEqual(["NOT_THE_PERSON", "CANNOT_ASSUME_NOW", "RECEIVED_BY_MISTAKE"]);
  });

  it("tem um rótulo para cada motivo", () => {
    expect(Object.keys(DECLINE_REASON_LABELS)).toEqual(Object.values(DECLINE_REASONS));
  });
});

describe("isDeclineReason", () => {
  it.each(Object.values(DECLINE_REASONS))("aceita %s", (reason) => {
    expect(isDeclineReason(reason)).toBe(true);
  });

  it.each([["OUTRO"], ["CANNOT_ASSUME"], ["toString"], ["__proto__"], [""], [null], [undefined], [42]])(
    "recusa %s",
    (value) => {
      expect(isDeclineReason(value)).toBe(false);
    },
  );
});
