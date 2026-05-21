import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("não renderiza nada quando totalPages é 1", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it("não renderiza nada quando totalPages é 0", () => {
    const { container } = render(<Pagination page={1} totalPages={0} onPageChange={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it("renderiza a navegação quando totalPages é maior que 1", () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByRole("navigation", { name: "Paginação" })).toBeInTheDocument();
  });

  it("exibe a informação de página atual e total", () => {
    render(<Pagination page={3} totalPages={7} onPageChange={vi.fn()} />);

    expect(screen.getByText("3 de 7")).toBeInTheDocument();
  });

  it("desabilita o botão anterior na primeira página", () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
  });

  it("desabilita o botão próxima na última página", () => {
    render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled();
  });

  it("habilita ambos os botões em página intermediária", () => {
    render(<Pagination page={3} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Página anterior" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeEnabled();
  });

  it("chama onPageChange com page - 1 ao clicar em anterior", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Página anterior" }));

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(onPageChange).toHaveBeenCalledTimes(1);
  });

  it("chama onPageChange com page + 1 ao clicar em próxima", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));

    expect(onPageChange).toHaveBeenCalledWith(4);
    expect(onPageChange).toHaveBeenCalledTimes(1);
  });
});
