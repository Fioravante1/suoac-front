import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { signSession, unsignSession } from "./session-signature";

const PAYLOAD = JSON.stringify({ id: "user-1", circuitId: "circuit-1", role: "CIRCUIT_COORDINATOR" });

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret-com-tamanho-suficiente";
});

afterEach(() => {
  delete process.env.SESSION_SECRET;
});

describe("signSession / unsignSession", () => {
  it("faz roundtrip do payload original quando a assinatura é válida", async () => {
    const token = await signSession(PAYLOAD);

    expect(token).toContain(".");
    await expect(unsignSession(token)).resolves.toBe(PAYLOAD);
  });

  it("retorna null quando o payload foi adulterado", async () => {
    const token = await signSession(PAYLOAD);
    const [, signature] = token.split(".");

    const tamperedPayload = Buffer.from(
      JSON.stringify({ id: "user-1", circuitId: "circuit-999", role: "CIRCUIT_COORDINATOR" }),
      "utf8",
    ).toString("base64url");

    await expect(unsignSession(`${tamperedPayload}.${signature}`)).resolves.toBeNull();
  });

  it("retorna null quando a assinatura foi adulterada", async () => {
    const token = await signSession(PAYLOAD);
    const [encodedPayload] = token.split(".");

    await expect(unsignSession(`${encodedPayload}.assinaturaInvalida`)).resolves.toBeNull();
  });

  it("retorna null para token malformado (sem separador)", async () => {
    await expect(unsignSession("sem-separador")).resolves.toBeNull();
  });

  it("retorna null quando assinado com outro segredo", async () => {
    const token = await signSession(PAYLOAD);

    process.env.SESSION_SECRET = "outro-segredo-completamente-diferente";

    await expect(unsignSession(token)).resolves.toBeNull();
  });

  it("retorna null (fail-closed) quando o segredo não está configurado na verificação", async () => {
    const token = await signSession(PAYLOAD);

    delete process.env.SESSION_SECRET;

    await expect(unsignSession(token)).resolves.toBeNull();
  });

  it("lança ao assinar sem segredo configurado", async () => {
    delete process.env.SESSION_SECRET;

    await expect(signSession(PAYLOAD)).rejects.toThrow("SESSION_SECRET is not configured");
  });
});
