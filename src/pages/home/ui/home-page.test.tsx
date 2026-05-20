import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ set: vi.fn(), get: vi.fn(), delete: vi.fn(), has: vi.fn() })),
}));

import { HomePage } from "./home-page";

describe("HomePage", () => {
  it("renderiza a mensagem de boas-vindas", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
      }),
    ).toHaveTextContent(/Bem-vindo/);
  });
});
