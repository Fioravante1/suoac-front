import { act, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "./toast-provider";
import { useToast } from "./use-toast";

const onRetry = vi.fn();

function Trigger() {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success("Salvo com sucesso")}>sucesso</button>
      <button onClick={() => toast.error("Falhou ao salvar")}>erro</button>
      <button
        onClick={() => toast.error("Falhou ao excluir", { action: { label: "Tentar novamente", onClick: onRetry } })}
      >
        erro com ação
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  );
}

describe("Toast", () => {
  afterEach(() => {
    vi.useRealTimers();
    onRetry.mockClear();
  });

  it("exibe um toast de sucesso e permite fechá-lo", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("sucesso"));
    expect(screen.getByText("Salvo com sucesso")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Fechar"));
    expect(screen.queryByText("Salvo com sucesso")).not.toBeInTheDocument();
  });

  it("usa role alert para erros e status para sucesso", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("erro"));
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou ao salvar");

    fireEvent.click(screen.getByText("sucesso"));
    expect(screen.getByRole("status")).toHaveTextContent("Salvo com sucesso");
  });

  it("remove o toast automaticamente após a duração", () => {
    vi.useFakeTimers();
    renderWithProvider();

    act(() => {
      fireEvent.click(screen.getByText("sucesso"));
    });
    expect(screen.getByText("Salvo com sucesso")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText("Salvo com sucesso")).not.toBeInTheDocument();
  });

  it("dispara a ação de recuperação e fecha o toast ao clicar", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("erro com ação"));

    const actionButton = screen.getByRole("button", { name: "Tentar novamente" });
    fireEvent.click(actionButton);

    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByText("Falhou ao excluir")).not.toBeInTheDocument();
  });

  it("não remove automaticamente o toast que tem ação de recuperação", () => {
    vi.useFakeTimers();
    renderWithProvider();

    act(() => {
      fireEvent.click(screen.getByText("erro com ação"));
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText("Falhou ao excluir")).toBeInTheDocument();
  });

  it("não quebra quando usado fora do provider (no-op)", () => {
    expect(() => render(<Trigger />)).not.toThrow();

    fireEvent.click(screen.getByText("sucesso"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
