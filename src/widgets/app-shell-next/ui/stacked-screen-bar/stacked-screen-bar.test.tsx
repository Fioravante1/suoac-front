import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ usePathname: vi.fn(), useAuthPermissions: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname: mocks.usePathname }));
vi.mock("@/shared/auth", () => ({ useAuthPermissions: mocks.useAuthPermissions }));

import { StackedScreenBar } from "./stacked-screen-bar";

describe("StackedScreenBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: true });
  });

  it.each(["/buses", "/congregations", "/lists", "/congregations/123"])(
    "volta para Mais a partir de %s",
    (pathname) => {
      mocks.usePathname.mockReturnValue(pathname);

      render(<StackedScreenBar />);

      expect(screen.getByRole("link", { name: "Mais" })).toHaveAttribute("href", "/more");
    },
  );

  it.each(["/more", "/dashboard", "/financial", "/passengers"])("não aparece em %s", (pathname) => {
    mocks.usePathname.mockReturnValue(pathname);

    const { container } = render(<StackedScreenBar />);

    expect(container).toBeEmptyDOMElement();
  });

  it("fica de fora para os papéis da congregação", () => {
    mocks.usePathname.mockReturnValue("/congregations");
    mocks.useAuthPermissions.mockReturnValue({ isCircuitUser: false });

    const { container } = render(<StackedScreenBar />);

    expect(container).toBeEmptyDOMElement();
  });
});
