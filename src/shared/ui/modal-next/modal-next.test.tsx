import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, useRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { ModalNext } from "./modal-next";

function getDialog(name = "Trocar evento") {
  return screen.getByRole("dialog", { name });
}

describe("ModalNext", () => {
  it("não renderiza nada fechado", () => {
    render(
      <ModalNext open={false} onClose={vi.fn()} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre como diálogo modal nomeado pelo título, direto no body", () => {
    const { container } = render(
      <ModalNext open onClose={vi.fn()} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    expect(getDialog()).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { level: 2, name: "Trocar evento" })).toBeInTheDocument();
    // Em portal: fica fora do container de quem renderiza, para não herdar camada nem corte.
    expect(container).not.toContainElement(getDialog());
  });

  it("fecha pelo botão Fechar", () => {
    const onClose = vi.fn();
    render(
      <ModalNext open onClose={onClose} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fecha com Esc", () => {
    const onClose = vi.fn();
    render(
      <ModalNext open onClose={onClose} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    fireEvent.keyDown(getDialog(), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fecha com Esc mesmo com o foco caído no body", () => {
    // Acontece quando o botão focado fica desabilitado durante o envio.
    const onClose = vi.fn();
    render(
      <ModalNext open onClose={onClose} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    getDialog().blur();
    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("com um modal aberto sobre outro, o Esc fecha só o de cima", () => {
    const onCloseOuter = vi.fn();
    const onCloseInner = vi.fn();
    render(
      <ModalNext open onClose={onCloseOuter} title="Trocar evento">
        <ModalNext open onClose={onCloseInner} title="Confirmar troca">
          confirmação
        </ModalNext>
      </ModalNext>,
    );

    fireEvent.keyDown(getDialog("Confirmar troca"), { key: "Escape" });

    expect(onCloseInner).toHaveBeenCalledTimes(1);
    expect(onCloseOuter).not.toHaveBeenCalled();
  });

  it("ignora o Esc que outra camada já tratou", () => {
    const onClose = vi.fn();
    render(
      <ModalNext open onClose={onClose} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    event.preventDefault();
    getDialog().dispatchEvent(event);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("fecha ao tocar no fundo escurecido", () => {
    const onClose = vi.fn();
    render(
      <ModalNext open onClose={onClose} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    fireEvent.click(getDialog().previousElementSibling as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("não fecha ao tocar dentro do painel", () => {
    const onClose = vi.fn();
    render(
      <ModalNext open onClose={onClose} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    fireEvent.click(screen.getByText("conteúdo"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("mostra a alça só no sheet, e ela também fecha", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <ModalNext open onClose={onClose} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    const handle = getDialog().firstElementChild as HTMLElement;
    expect(handle).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(handle);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <ModalNext open onClose={onClose} title="Trocar evento" variant="wide">
        conteúdo
      </ModalNext>,
    );

    expect(getDialog().firstElementChild?.tagName).toBe("HEADER");
  });

  it("renderiza o rodapé só quando recebe um", () => {
    const { rerender } = render(
      <ModalNext open onClose={vi.fn()} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    expect(screen.queryByRole("button", { name: "Confirmar" })).not.toBeInTheDocument();

    rerender(
      <ModalNext open onClose={vi.fn()} title="Trocar evento" footer={<button type="button">Confirmar</button>}>
        conteúdo
      </ModalNext>,
    );

    expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
  });

  it("aplica no painel a classe de quem usa, onde ficam as medidas do desktop", () => {
    render(
      <ModalNext open onClose={vi.fn()} title="Trocar evento" className="larguraDoFormulario">
        conteúdo
      </ModalNext>,
    );

    expect(getDialog()).toHaveClass("larguraDoFormulario");
  });

  it("leva o foco ao painel ao abrir", () => {
    render(
      <ModalNext open onClose={vi.fn()} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    expect(getDialog()).toHaveFocus();
  });

  it("respeita o autoFocus de um campo dentro do modal", () => {
    render(
      <ModalNext open onClose={vi.fn()} title="Trocar evento" variant="wide">
        <input aria-label="Buscar" autoFocus />
      </ModalNext>,
    );

    expect(screen.getByRole("textbox", { name: "Buscar" })).toHaveFocus();
  });

  it("mantém o autoFocus no StrictMode, que monta os efeitos duas vezes", async () => {
    render(
      <StrictMode>
        <button type="button">Abrir</button>
        <ModalNext open onClose={vi.fn()} title="Trocar evento" variant="wide">
          <input aria-label="Buscar" autoFocus />
        </ModalNext>
      </StrictMode>,
    );

    await Promise.resolve();

    expect(screen.getByRole("textbox", { name: "Buscar" })).toHaveFocus();
  });

  it("mantém o Tab dentro do modal", () => {
    render(
      <ModalNext open onClose={vi.fn()} title="Trocar evento">
        <button type="button">Último</button>
      </ModalNext>,
    );

    screen.getByRole("button", { name: "Último" }).focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });

    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
  });

  it("traz o Tab de volta ao modal quando o foco caiu no body", () => {
    render(
      <ModalNext open onClose={vi.fn()} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    getDialog().blur();
    fireEvent.keyDown(document.body, { key: "Tab" });

    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
  });

  it("devolve o foco a quem abriu ao fechar", async () => {
    function Harness({ open }: Readonly<{ open: boolean }>) {
      return (
        <>
          <button type="button">Abrir</button>
          <ModalNext open={open} onClose={vi.fn()} title="Trocar evento">
            conteúdo
          </ModalNext>
        </>
      );
    }

    const { rerender } = render(<Harness open={false} />);
    const opener = screen.getByRole("button", { name: "Abrir" });
    opener.focus();

    rerender(<Harness open />);
    expect(getDialog()).toHaveFocus();

    rerender(<Harness open={false} />);
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("devolve o foco ao returnFocusRef quando quem abriu sumiu", async () => {
    function Harness({ open }: Readonly<{ open: boolean }>) {
      const triggerRef = useRef<HTMLButtonElement>(null);

      return (
        <>
          <button type="button" ref={triggerRef}>
            Mais ações
          </button>
          {!open && <button type="button">Item do menu</button>}
          <ModalNext open={open} onClose={vi.fn()} title="Trocar evento" returnFocusRef={triggerRef}>
            conteúdo
          </ModalNext>
        </>
      );
    }

    const { rerender } = render(<Harness open={false} />);
    screen.getByRole("button", { name: "Item do menu" }).focus();

    rerender(<Harness open />);
    rerender(<Harness open={false} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Mais ações" })).toHaveFocus());
  });

  it("trava a rolagem da página no <html> e a solta ao fechar", () => {
    const { rerender } = render(
      <ModalNext open onClose={vi.fn()} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    expect(document.documentElement.style.overflow).toBe("hidden");

    rerender(
      <ModalNext open={false} onClose={vi.fn()} title="Trocar evento">
        conteúdo
      </ModalNext>,
    );

    expect(document.documentElement.style.overflow).toBe("");
  });

  it("não deixa a página travada quando dois modais fecham juntos", () => {
    function Harness({ open }: Readonly<{ open: boolean }>) {
      return (
        <ModalNext open={open} onClose={vi.fn()} title="Trocar evento">
          <ModalNext open={open} onClose={vi.fn()} title="Confirmar troca">
            confirmação
          </ModalNext>
        </ModalNext>
      );
    }

    const { rerender } = render(<Harness open />);
    expect(document.documentElement.style.overflow).toBe("hidden");

    rerender(<Harness open={false} />);
    expect(document.documentElement.style.overflow).toBe("");
  });
});
