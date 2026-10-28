import { afterEach, describe, expect, it, vi } from "vitest";

import { containTabKey, getFocusableElements, getFocusedElement } from "./focus-trap";

function mountContainer(html: string): HTMLElement {
  const container = document.createElement("div");
  container.tabIndex = -1;
  container.innerHTML = html;
  document.body.append(container);

  return container;
}

function tab(shiftKey = false) {
  return { key: "Tab", shiftKey, preventDefault: vi.fn() };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("getFocusableElements", () => {
  it("lista o que recebe foco pelo Tab, na ordem do documento", () => {
    const container = mountContainer(`
      <button id="a">A</button>
      <a id="b" href="#">B</a>
      <input id="c" />
    `);

    expect(getFocusableElements(container).map((element) => element.id)).toEqual(["a", "b", "c"]);
  });

  it("deixa de fora desabilitados, ocultos, inertes e tabindex -1", () => {
    const container = mountContainer(`
      <button disabled>desabilitado</button>
      <fieldset disabled><input /></fieldset>
      <input type="hidden" />
      <a>sem href</a>
      <div tabindex="-1">só por código</div>
      <div inert><button>inerte</button></div>
      <div hidden><button>escondido</button></div>
      <button id="ok">ok</button>
    `);

    expect(getFocusableElements(container).map((element) => element.id)).toEqual(["ok"]);
  });

  it("deixa de fora controle com tabindex -1, como o botão de mostrar senha", () => {
    const container = mountContainer(`
      <input id="senha" type="password" />
      <button tabindex="-1">Mostrar senha</button>
    `);

    expect(getFocusableElements(container).map((element) => element.id)).toEqual(["senha"]);
  });

  it("para uma vez só num grupo de rádios, no marcado", () => {
    const container = mountContainer(`
      <input type="radio" name="pagamento" id="pendente" />
      <input type="radio" name="pagamento" id="pago" checked />
      <input type="radio" name="pagamento" id="parcial" />
      <button id="salvar">Salvar</button>
    `);

    expect(getFocusableElements(container).map((element) => element.id)).toEqual(["pago", "salvar"]);
  });

  it("para no primeiro rádio quando nenhum do grupo está marcado", () => {
    const container = mountContainer(`
      <input type="radio" name="pagamento" id="pendente" />
      <input type="radio" name="pagamento" id="pago" />
    `);

    expect(getFocusableElements(container).map((element) => element.id)).toEqual(["pendente"]);
  });

  it("deixa de fora o que não aparece na tela, quando o navegador sabe dizer", () => {
    const container = mountContainer(`<button id="visivel">A</button><button id="invisivel">B</button>`);
    const invisible = container.querySelector("#invisivel") as HTMLElement;
    const visible = container.querySelector("#visivel") as HTMLElement;
    visible.checkVisibility = () => true;
    invisible.checkVisibility = () => false;

    expect(getFocusableElements(container).map((element) => element.id)).toEqual(["visivel"]);
  });
});

describe("getFocusedElement", () => {
  it("devolve o elemento com foco", () => {
    const container = mountContainer(`<button id="a">A</button>`);
    const button = container.querySelector("button") as HTMLButtonElement;
    button.focus();

    expect(getFocusedElement()).toBe(button);
  });

  it("devolve null com o foco no body", () => {
    expect(getFocusedElement()).toBeNull();
  });
});

describe("containTabKey", () => {
  it("leva o Tab do último elemento de volta ao primeiro", () => {
    const container = mountContainer(`<button id="a">A</button><button id="b">B</button>`);
    const [first, last] = getFocusableElements(container);
    last.focus();
    const event = tab();

    containTabKey(event, container);

    expect(first).toHaveFocus();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("leva o Shift+Tab do primeiro elemento ao último", () => {
    const container = mountContainer(`<button id="a">A</button><button id="b">B</button>`);
    const [first, last] = getFocusableElements(container);
    first.focus();

    containTabKey(tab(true), container);

    expect(last).toHaveFocus();
  });

  it("leva o Shift+Tab do próprio container ao último elemento", () => {
    const container = mountContainer(`<button id="a">A</button><button id="b">B</button>`);
    const [, last] = getFocusableElements(container);
    container.focus();

    containTabKey(tab(true), container);

    expect(last).toHaveFocus();
  });

  it("traz de volta o foco que escapou do container", () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    const container = mountContainer(`<button id="a">A</button><button id="b">B</button>`);
    const [first] = getFocusableElements(container);
    outside.focus();

    containTabKey(tab(), container);

    expect(first).toHaveFocus();
  });

  it("deixa o navegador andar entre elementos do meio", () => {
    const container = mountContainer(`<button>A</button><button id="b">B</button><button>C</button>`);
    const [, middle] = getFocusableElements(container);
    middle.focus();
    const event = tab();

    containTabKey(event, container);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(middle).toHaveFocus();
  });

  it("segura o foco no container quando não há nada focável dentro", () => {
    const container = mountContainer(`<p>só texto</p>`);
    const event = tab();

    containTabKey(event, container);

    expect(container).toHaveFocus();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("ignora outras teclas", () => {
    const container = mountContainer(`<button>A</button>`);
    const event = { key: "Enter", shiftKey: false, preventDefault: vi.fn() };

    containTabKey(event, container);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
