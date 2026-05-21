import { describe, expect, it } from "vitest";

import { USER_ROLES } from "./user-role";

describe("USER_ROLES", () => {
  it("contem os 4 papeis esperados", () => {
    expect(Object.keys(USER_ROLES)).toHaveLength(4);
    expect(USER_ROLES.CIRCUIT_COORDINATOR).toBe("CIRCUIT_COORDINATOR");
    expect(USER_ROLES.CIRCUIT_ASSISTANT).toBe("CIRCUIT_ASSISTANT");
    expect(USER_ROLES.CONGREGATION_COORDINATOR).toBe("CONGREGATION_COORDINATOR");
    expect(USER_ROLES.CONGREGATION_ASSISTANT).toBe("CONGREGATION_ASSISTANT");
  });
});
