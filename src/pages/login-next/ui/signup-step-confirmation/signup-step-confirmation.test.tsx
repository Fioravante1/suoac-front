import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignupStepConfirmation } from "./signup-step-confirmation";

function renderConfirmation(overrides: Partial<Parameters<typeof SignupStepConfirmation>[0]> = {}) {
  const onClearError = vi.fn();
  const onConfirm = vi.fn();
  const onResend = vi.fn().mockResolvedValue(true);

  render(
    <SignupStepConfirmation
      email="joao@example.com"
      serverError={null}
      isConfirming={false}
      isResending={false}
      onClearError={onClearError}
      onConfirm={onConfirm}
      onResend={onResend}
      {...overrides}
    />,
  );

  return { onClearError, onConfirm, onResend };
}

function digitBoxes(): HTMLInputElement[] {
  return screen.getAllByRole("textbox") as HTMLInputElement[];
}

afterEach(() => {
  vi.useRealTimers();
});

describe("SignupStepConfirmation", () => {
  describe("estrutura e acessibilidade", () => {
    it("deve exibir o e-mail de destino, a validade de 30 minutos e o grupo acessível de 6 caixas", () => {
      renderConfirmation();

      expect(screen.getByRole("heading", { name: "Confirme seu e-mail" })).toBeInTheDocument();
      expect(screen.getByText("joao@example.com")).toBeInTheDocument();
      expect(screen.getByText(/Ele vale por 30 minutos/)).toBeInTheDocument();

      const group = screen.getByRole("group", { name: "Código de confirmação de 6 dígitos" });
      expect(group).toBeInTheDocument();

      const boxes = digitBoxes();
      expect(boxes).toHaveLength(6);
      expect(boxes[0]).toHaveAttribute("inputMode", "numeric");
      expect(boxes[0]).toHaveAttribute("autoComplete", "one-time-code");
      expect(boxes[0]).toHaveFocus();
    });
  });

  describe("digitação, teclado e colagem", () => {
    it("deve avançar o foco automaticamente a cada dígito digitado", () => {
      renderConfirmation();
      const boxes = digitBoxes();

      fireEvent.change(boxes[0], { target: { value: "4" } });
      expect(boxes[0]).toHaveValue("4");
      expect(boxes[1]).toHaveFocus();

      fireEvent.change(boxes[1], { target: { value: "8" } });
      expect(boxes[1]).toHaveValue("8");
      expect(boxes[2]).toHaveFocus();
    });

    it("deve voltar para a caixa anterior e apagá-la ao pressionar Backspace em caixa vazia", () => {
      renderConfirmation();
      const boxes = digitBoxes();

      fireEvent.change(boxes[0], { target: { value: "4" } });
      fireEvent.change(boxes[1], { target: { value: "8" } });
      expect(boxes[2]).toHaveFocus();

      fireEvent.keyDown(boxes[2], { key: "Backspace" });

      expect(boxes[1]).toHaveValue("");
      expect(boxes[1]).toHaveFocus();
    });

    it("deve limpar a caixa atual sem recuar quando ela própria tem dígito e recebe Backspace", () => {
      renderConfirmation();
      const boxes = digitBoxes();

      fireEvent.change(boxes[0], { target: { value: "4" } });
      boxes[0].focus();
      fireEvent.keyDown(boxes[0], { key: "Backspace" });

      expect(boxes[0]).toHaveValue("");
      expect(boxes[0]).toHaveFocus();
    });

    it("deve navegar entre as caixas com ArrowLeft e ArrowRight e permitir sobrescrever dígito", () => {
      renderConfirmation();
      const boxes = digitBoxes();

      fireEvent.change(boxes[0], { target: { value: "1" } });
      fireEvent.change(boxes[1], { target: { value: "2" } });

      fireEvent.keyDown(boxes[2], { key: "ArrowLeft" });
      expect(boxes[1]).toHaveFocus();

      fireEvent.keyDown(boxes[1], { key: "ArrowRight" });
      expect(boxes[2]).toHaveFocus();

      boxes[0].focus();
      fireEvent.keyDown(boxes[0], { key: "9" });
      expect(boxes[0]).toHaveValue("9");
      expect(boxes[1]).toHaveFocus();
    });

    it("deve distribuir o código colado nas 6 caixas e submeter automaticamente quando completo", () => {
      const { onConfirm } = renderConfirmation();
      const boxes = digitBoxes();

      fireEvent.paste(boxes[0], {
        clipboardData: { getData: () => " 940-271 " },
      });

      expect(boxes.map((box) => box.value)).toEqual(["9", "4", "0", "2", "7", "1"]);
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith("940271");
    });

    it("deve distribuir colagem parcial e focar a primeira caixa vazia sem submeter", () => {
      const { onConfirm } = renderConfirmation();
      const boxes = digitBoxes();

      fireEvent.paste(boxes[0], {
        clipboardData: { getData: () => "940" },
      });

      expect(boxes.map((box) => box.value)).toEqual(["9", "4", "0", "", "", ""]);
      expect(boxes[3]).toHaveFocus();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("submissão manual e validação", () => {
    it("deve exigir os 6 dígitos ao clicar em Confirmar com o código incompleto", () => {
      const { onConfirm } = renderConfirmation();
      const boxes = digitBoxes();

      fireEvent.change(boxes[0], { target: { value: "1" } });
      fireEvent.change(boxes[1], { target: { value: "2" } });
      fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

      expect(screen.getByRole("alert")).toHaveTextContent("Digite os 6 dígitos do código.");
      expect(boxes[0]).toHaveAttribute("aria-invalid", "true");
      expect(boxes[2]).toHaveFocus();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("deve submeter quando os 6 dígitos foram digitados e Confirmar é clicado", () => {
      const { onConfirm } = renderConfirmation();
      const boxes = digitBoxes();

      "654321".split("").forEach((digit, index) => {
        fireEvent.change(boxes[index], { target: { value: digit } });
      });

      fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

      expect(onConfirm).toHaveBeenCalledWith("654321");
    });
  });

  describe("temporizador e reenvio de código", () => {
    it("deve iniciar com espera de 60s bloqueando o reenvio e liberar ao zerar", async () => {
      vi.useFakeTimers();
      const { onResend } = renderConfirmation();

      const resendButton = screen.getByRole("button", { name: "Reenviar código em 1:00" });
      expect(resendButton).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(15_000);
      });
      expect(screen.getByRole("button", { name: "Reenviar código em 0:45" })).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(45_000);
      });
      const unlockedButton = screen.getByRole("button", { name: "Reenviar código" });
      expect(unlockedButton).toBeEnabled();

      await act(async () => {
        fireEvent.click(unlockedButton);
      });

      expect(onResend).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("status")).toHaveTextContent("Novo código enviado.");
      expect(screen.getByRole("button", { name: "Reenviar código em 1:00" })).toBeDisabled();
    });

    it("deve liberar o botão de reenviar imediatamente quando o código expira (410)", () => {
      renderConfirmation({
        serverError: 'Este código expirou. Clique em "Reenviar código" para receber um novo.',
        isServerCodeExpired: true,
      });

      expect(screen.getByRole("button", { name: "Reenviar código" })).toBeEnabled();
    });

    it("deve limpar o código anterior ao reenviar com sucesso", async () => {
      vi.useFakeTimers();
      renderConfirmation();
      const boxes = digitBoxes();

      fireEvent.change(boxes[0], { target: { value: "7" } });
      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
      });

      expect(screen.getByRole("status")).toHaveTextContent("Novo código enviado.");
      expect(boxes[0]).toHaveValue("");
    });
  });
});
