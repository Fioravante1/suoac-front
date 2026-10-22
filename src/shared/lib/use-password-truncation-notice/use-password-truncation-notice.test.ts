import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PASSWORD_MAX_LENGTH, PASSWORD_TRUNCATED_MESSAGE } from "../password-policy";
import { usePasswordTruncationNotice } from "./use-password-truncation-notice";

/** Colagem num campo com `value`, trecho selecionado opcional. */
function pasteEvent(pasted: string, value: string, selection = 0) {
  return {
    currentTarget: { value, selectionStart: 0, selectionEnd: selection },
    clipboardData: { getData: () => pasted },
  } as unknown as React.ClipboardEvent<HTMLInputElement>;
}

const NO_TETO = "a".repeat(PASSWORD_MAX_LENGTH);

describe("usePasswordTruncationNotice", () => {
  it("não avisa nada antes de qualquer colagem", () => {
    const { result } = renderHook(() => usePasswordTruncationNotice(""));

    expect(result.current.truncationNotice).toBeUndefined();
  });

  it("espera o campo refletir a colagem antes de avisar", () => {
    // O aviso depende do valor que chega de volta: so quando o campo esta no
    // teto e que o corte de fato aconteceu.
    const { result } = renderHook(({ value }) => usePasswordTruncationNotice(value), {
      initialProps: { value: "" },
    });

    act(() => result.current.handlePaste(pasteEvent("a".repeat(PASSWORD_MAX_LENGTH + 28), "")));

    expect(result.current.truncationNotice).toBeUndefined();
  });

  it("mostra o aviso enquanto o campo continua no teto", () => {
    const { result, rerender } = renderHook(({ value }) => usePasswordTruncationNotice(value), {
      initialProps: { value: "" },
    });

    act(() => result.current.handlePaste(pasteEvent("a".repeat(PASSWORD_MAX_LENGTH + 28), "")));
    rerender({ value: NO_TETO });

    expect(result.current.truncationNotice).toBe(PASSWORD_TRUNCATED_MESSAGE);
  });

  it("some sozinho quando a pessoa apaga o excedente", () => {
    const { result, rerender } = renderHook(({ value }) => usePasswordTruncationNotice(value), {
      initialProps: { value: "" },
    });

    act(() => result.current.handlePaste(pasteEvent("a".repeat(PASSWORD_MAX_LENGTH + 28), "")));
    rerender({ value: NO_TETO });
    rerender({ value: "NovaSenha123" });

    expect(result.current.truncationNotice).toBeUndefined();
  });

  it("não avisa quando a colagem cabe", () => {
    const { result, rerender } = renderHook(({ value }) => usePasswordTruncationNotice(value), {
      initialProps: { value: "" },
    });

    act(() => result.current.handlePaste(pasteEvent("NovaSenha123", "")));
    rerender({ value: "NovaSenha123" });

    expect(result.current.truncationNotice).toBeUndefined();
  });

  it("desconta o trecho selecionado, que a colagem substitui", () => {
    // Colar sobre a senha inteira selecionada nao soma ao que ja estava la.
    const { result, rerender } = renderHook(({ value }) => usePasswordTruncationNotice(value), {
      initialProps: { value: NO_TETO },
    });

    act(() => result.current.handlePaste(pasteEvent("NovaSenha123", NO_TETO, PASSWORD_MAX_LENGTH)));
    rerender({ value: NO_TETO });

    expect(result.current.truncationNotice).toBeUndefined();
  });
});
