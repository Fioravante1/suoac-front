import { fireEvent, render, screen, within } from "@testing-library/react";
import { CalendarCheck, Trash2 } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { ActionMenu } from "./action-menu";

describe("ActionMenu", () => {
  it("renderiza gatilho icon-only com nome acessível", () => {
    render(
      <ActionMenu items={[{ id: "edit", label: "Editar", icon: <CalendarCheck size={16} />, onSelect: vi.fn() }]} />,
    );

    const trigger = screen.getByRole("button", { name: "Ações" });

    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("data-tooltip", "Ações");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  });

  it("abre o menu e executa a ação selecionada", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ActionMenu
        items={[
          { id: "edit", label: "Editar", icon: <CalendarCheck size={16} />, onSelect: onEdit },
          { id: "delete", label: "Excluir", icon: <Trash2 size={16} />, onSelect: onDelete, variant: "danger" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ações" }));

    const menu = screen.getByRole("menu");

    fireEvent.click(within(menu).getByRole("menuitem", { name: "Editar" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
