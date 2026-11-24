import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Bus, Lock } from "lucide-react";

import { MoreRow } from "./more-row";

describe("MoreRow", () => {
  it("com href, é um link com a linha de apoio como descrição", () => {
    render(<MoreRow icon={Bus} tone="primary" label="Ônibus" hint="Mapa e ocupação" href="/buses" />);

    const link = screen.getByRole("link", { name: /Ônibus/ });

    expect(link).toHaveAttribute("href", "/buses");
    expect(link).toHaveTextContent("Mapa e ocupação");
  });

  it("sem href, é um botão que age ao toque", () => {
    const onClick = vi.fn();

    render(<MoreRow icon={Lock} tone="neutral" label="Sair" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("com `checked`, é um interruptor com o estado em aria-checked", () => {
    render(<MoreRow icon={Lock} tone="neutral" label="Tema escuro" checked onClick={vi.fn()} />);

    expect(screen.getByRole("switch", { name: "Tema escuro" })).toBeChecked();
  });

  it("desabilitada, fica no Tab, avisa por aria-disabled e não age", () => {
    const onClick = vi.fn();

    render(
      <MoreRow icon={Lock} tone="neutral" label="Alterar senha" isDisabled trailing="Em breve" onClick={onClick} />,
    );
    const button = screen.getByRole("button", { name: /Alterar senha/ });

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveTextContent("Em breve");
    expect(onClick).not.toHaveBeenCalled();
  });
});
