import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Skeleton, SkeletonText, SkeletonTableRows } from "./skeleton";

describe("Skeleton", () => {
  it("renderiza com aria-hidden", () => {
    const { container } = render(<Skeleton />);
    const bone = container.querySelector("span");

    expect(bone).toBeInTheDocument();
    expect(bone).toHaveAttribute("aria-hidden", "true");
  });

  it("aplica width e height via style", () => {
    const { container } = render(<Skeleton width="10rem" height="2rem" />);
    const bone = container.querySelector("span");

    expect(bone).toHaveStyle({ width: "10rem", height: "2rem" });
  });

  it("aceita className customizado", () => {
    const { container } = render(<Skeleton className="custom" />);
    const bone = container.querySelector("span");

    expect(bone?.className).toContain("custom");
  });
});

describe("SkeletonText", () => {
  it("renderiza 3 linhas por padrao", () => {
    render(<SkeletonText />);
    const status = screen.getByRole("status");

    expect(status.querySelectorAll("span")).toHaveLength(3);
  });

  it("renderiza o numero de linhas informado", () => {
    render(<SkeletonText lines={5} />);
    const status = screen.getByRole("status");

    expect(status.querySelectorAll("span")).toHaveLength(5);
  });

  it("possui aria-label Carregando", () => {
    render(<SkeletonText />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Carregando");
  });
});

describe("SkeletonTableRows", () => {
  it("renderiza 5 linhas por padrao", () => {
    render(<SkeletonTableRows />);
    const status = screen.getByRole("status");
    const rows = status.querySelectorAll("div > span");

    // 5 rows x 4 cells = 20 spans
    expect(rows).toHaveLength(20);
  });

  it("renderiza o numero de linhas informado", () => {
    render(<SkeletonTableRows rows={3} />);
    const status = screen.getByRole("status");
    const rows = status.querySelectorAll("div > span");

    // 3 rows x 4 cells = 12 spans
    expect(rows).toHaveLength(12);
  });

  it("possui aria-label Carregando", () => {
    render(<SkeletonTableRows />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Carregando");
  });
});
