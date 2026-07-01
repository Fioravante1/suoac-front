import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { PaymentStatusFilter } from "./payment-status-filter";

const counts = { paid: 20, partial: 8, pending: 15, exempt: 5 };

describe("PaymentStatusFilter", () => {
  it("exibe as contagens por status e o total em 'Todos'", () => {
    render(<PaymentStatusFilter value="ALL" onChange={vi.fn()} counts={counts} total={48} />);

    expect(screen.getByRole("button", { name: /Todos/ })).toHaveTextContent("48");
    expect(screen.getByRole("button", { name: /Pendente/ })).toHaveTextContent("15");
    expect(screen.getByRole("button", { name: /Isento/ })).toHaveTextContent("5");
  });

  it("marca o filtro ativo via aria-pressed", () => {
    render(<PaymentStatusFilter value="PENDING" onChange={vi.fn()} counts={counts} total={48} />);

    expect(screen.getByRole("button", { name: /Pendente/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Todos/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("dispara onChange com o status selecionado", () => {
    const onChange = vi.fn();
    render(<PaymentStatusFilter value="ALL" onChange={onChange} counts={counts} total={48} />);

    fireEvent.click(screen.getByRole("button", { name: /Pago/ }));
    expect(onChange).toHaveBeenCalledWith("PAID");
  });
});
