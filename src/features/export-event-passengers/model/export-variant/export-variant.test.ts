import { describe, it, expect } from "vitest";

import {
  EXPORT_VARIANTS,
  EXPORT_VARIANT_DESCRIPTIONS,
  EXPORT_VARIANT_LABELS,
  type ExportVariant,
} from "./export-variant";

describe("EXPORT_VARIANTS", () => {
  it("expõe as duas variantes do contrato (carrier e boarding)", () => {
    expect(EXPORT_VARIANTS).toEqual({ CARRIER: "carrier", BOARDING: "boarding" });
  });

  it("tem label e descrição para cada variante", () => {
    const variants: ExportVariant[] = [EXPORT_VARIANTS.CARRIER, EXPORT_VARIANTS.BOARDING];

    for (const variant of variants) {
      expect(EXPORT_VARIANT_LABELS[variant]).toBeTruthy();
      expect(EXPORT_VARIANT_DESCRIPTIONS[variant]).toBeTruthy();
    }
  });
});
