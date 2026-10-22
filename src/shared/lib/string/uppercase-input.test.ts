import { describe, expect, it } from "vitest";

import { uppercaseInput } from "./uppercase-input";

describe("uppercaseInput", () => {
  it("converte o valor e mantém o cursor no meio", () => {
    const input = document.createElement("input");
    input.value = "sp-019 a";
    input.setSelectionRange(4, 4);
    uppercaseInput(input);
    expect(input.value).toBe("SP-019 A");
    expect(input.selectionStart).toBe(4);
    expect(input.selectionEnd).toBe(4);
  });

  it("preserva o intervalo selecionado e sua direção", () => {
    const input = document.createElement("input");
    input.value = "sp-019 a";
    input.setSelectionRange(1, 6, "backward");
    uppercaseInput(input);
    expect(input.value).toBe("SP-019 A");
    expect(input.selectionStart).toBe(1);
    expect(input.selectionEnd).toBe(6);
    expect(input.selectionDirection).toBe("backward");
  });

  it("ajusta a seleção quando uma letra se expande em maiúsculas", () => {
    const input = document.createElement("input");
    input.value = "aßb";
    input.setSelectionRange(2, 3, "forward");
    uppercaseInput(input);
    expect(input.value).toBe("ASSB");
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(4);
    expect(input.selectionDirection).toBe("forward");
  });

  it("mantém o campo vazio", () => {
    const input = document.createElement("input");
    uppercaseInput(input);
    expect(input.value).toBe("");
    expect(input.selectionStart).toBe(0);
  });

  it("aceita campo sem suporte a seleção", () => {
    const input = document.createElement("input");
    input.type = "email";
    input.value = "joao@example.com";
    expect(() => uppercaseInput(input)).not.toThrow();
    expect(input.value).toBe("JOAO@EXAMPLE.COM");
  });
});
