import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { Select } from "./select";

const options = [
  { value: "a", label: "Opção A" },
  { value: "b", label: "Opção B" },
];

describe("Select", () => {
  it("renderiza as opções fornecidas", () => {
    render(<Select options={options} aria-label="Teste" />);

    expect(screen.getByRole("option", { name: "Opção A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Opção B" })).toBeInTheDocument();
  });

  it("renderiza o placeholder como primeira opção vazia", () => {
    render(<Select options={options} placeholder="Selecione" aria-label="Teste" />);

    const placeholder = screen.getByRole("option", { name: "Selecione" }) as HTMLOptionElement;
    expect(placeholder.value).toBe("");
  });

  it("dispara onChange ao selecionar", () => {
    const onChange = vi.fn();
    render(<Select options={options} value="a" onChange={onChange} aria-label="Teste" />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
    expect(onChange).toHaveBeenCalled();
  });
});
