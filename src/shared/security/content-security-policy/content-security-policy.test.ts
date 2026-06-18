import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildContentSecurityPolicy, generateNonce } from "./content-security-policy";

describe("generateNonce", () => {
  it("gera um nonce não vazio", () => {
    expect(generateNonce().length).toBeGreaterThan(0);
  });

  it("gera nonces únicos a cada chamada", () => {
    expect(generateNonce()).not.toBe(generateNonce());
  });
});

describe("buildContentSecurityPolicy", () => {
  it("inclui o nonce no script-src com strict-dynamic", () => {
    const csp = buildContentSecurityPolicy("abc123", false);

    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
  });

  it("bloqueia object e frame-ancestors", () => {
    const csp = buildContentSecurityPolicy("abc123", false);

    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("em produção não permite unsafe-eval e força upgrade-insecure-requests", () => {
    const csp = buildContentSecurityPolicy("abc123", false);

    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("em desenvolvimento permite unsafe-eval e omite upgrade-insecure-requests", () => {
    const csp = buildContentSecurityPolicy("abc123", true);

    expect(csp).toContain("'unsafe-eval'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});
