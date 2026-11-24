import { describe, expect, it } from "vitest";

import { findShortcutAction, getQuickActions } from "./quick-actions";

// "Inscrições até 12/10/2026", como a API grava o prazo.
const registrationDeadline = "2026-10-13T02:59:59.999Z";

function keyEvent(key: string, overrides: Partial<KeyboardEvent> = {}) {
  return {
    key,
    target: document.body,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    repeat: false,
    defaultPrevented: false,
    ...overrides,
  };
}

describe("getQuickActions", () => {
  it("com as inscrições abertas, traz as quatro ações do desenho, na ordem, com dica e atalho", () => {
    const actions = getQuickActions({
      registrationDeadline,
      canEnroll: true,
      registrationAction: "close",
    });

    expect(actions.map(({ label, hint, shortcut }) => [label, hint, shortcut])).toEqual([
      ["Cadastrar passageiro", "Nome, RG e dias", "N"],
      ["Registrar pagamento", "Total ou parcial", "P"],
      ["Exportar listas", "Por dia ou congregação", "E"],
      ["Encerrar inscrições", "Antes do prazo de 12/10", "X"],
    ]);
  });

  it("com as inscrições encerradas que ainda reabrem, tira Cadastrar e troca Encerrar por Reabrir, sem atalho", () => {
    const actions = getQuickActions({
      registrationDeadline,
      canEnroll: false,
      registrationAction: "reopen",
    });

    expect(actions.map(({ label, shortcut }) => [label, shortcut])).toEqual([
      ["Registrar pagamento", "P"],
      ["Exportar listas", "E"],
      ["Reabrir inscrições", null],
    ]);
    expect(actions.at(-1)?.hint).toBe("Até o prazo de 12/10");
  });

  it("sem inscrição a mexer, fica com pagamento e listas", () => {
    const actions = getQuickActions({
      registrationDeadline,
      canEnroll: false,
      registrationAction: null,
    });

    expect(actions.map(({ id }) => id)).toEqual(["payment", "export"]);
  });
});

describe("findShortcutAction", () => {
  const actions = getQuickActions({
    registrationDeadline,
    canEnroll: true,
    registrationAction: "close",
  });

  it("acha a ação pela letra, maiúscula ou minúscula", () => {
    expect(findShortcutAction(keyEvent("n"), actions, false)?.id).toBe("enroll");
    expect(findShortcutAction(keyEvent("X"), actions, false)?.id).toBe("close");
  });

  it("não reabre pelo X: reabrir não tem confirmação, e a tecla solta podia ser engano", () => {
    const reopenActions = getQuickActions({ registrationDeadline, canEnroll: false, registrationAction: "reopen" });

    expect(findShortcutAction(keyEvent("x"), reopenActions, false)).toBeNull();
  });

  it("ignora a letra que não é atalho, ou cuja ação não está no menu", () => {
    expect(findShortcutAction(keyEvent("a"), actions, false)).toBeNull();
    expect(findShortcutAction(keyEvent("n"), actions.slice(1), false)).toBeNull();
  });

  it("ignora a letra com Ctrl, Alt ou Cmd, que são do navegador e do sistema", () => {
    expect(findShortcutAction(keyEvent("n", { ctrlKey: true }), actions, false)).toBeNull();
    expect(findShortcutAction(keyEvent("n", { metaKey: true }), actions, false)).toBeNull();
    expect(findShortcutAction(keyEvent("n", { altKey: true }), actions, false)).toBeNull();
  });

  it("ignora a letra escrita num campo", () => {
    const input = document.createElement("input");
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");

    expect(findShortcutAction(keyEvent("n", { target: input }), actions, false)).toBeNull();
    expect(findShortcutAction(keyEvent("n", { target: editable }), actions, false)).toBeNull();
  });

  it("ignora a tecla segurada, a já tratada e a que chega com um modal aberto", () => {
    expect(findShortcutAction(keyEvent("n", { repeat: true }), actions, false)).toBeNull();
    expect(findShortcutAction(keyEvent("n", { defaultPrevented: true }), actions, false)).toBeNull();
    expect(findShortcutAction(keyEvent("n"), actions, true)).toBeNull();
  });
});
