import { afterEach, describe, expect, it } from "vitest";

import { lockDocumentScroll } from "./scroll-lock";

// A contagem é do módulo: uma trava esquecida por um teste que falhou no meio
// contaminaria todos os seguintes e esconderia a falha de verdade.
const locksInTest: Array<() => void> = [];

function lock(): () => void {
  const release = lockDocumentScroll();
  locksInTest.push(release);

  return release;
}

afterEach(() => {
  locksInTest.splice(0).forEach((release) => release());
  document.documentElement.style.overflow = "";
});

describe("lockDocumentScroll", () => {
  it("trava a rolagem no <html>, que é quem rola a página", () => {
    lock();

    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.overflow).toBe("");
  });

  it("devolve o valor que havia antes ao soltar", () => {
    document.documentElement.style.overflow = "auto";

    lock()();

    expect(document.documentElement.style.overflow).toBe("auto");
  });

  it("só solta quando o último a travar solta", () => {
    const releaseOuter = lock();
    const releaseInner = lock();

    releaseOuter();
    expect(document.documentElement.style.overflow).toBe("hidden");

    releaseInner();
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("não fica travada quando os dois soltam fora de ordem", () => {
    // Dois modais fechados na mesma atualização: o React desmonta o de fora antes.
    const releaseOuter = lock();
    const releaseInner = lock();

    releaseInner();
    releaseOuter();

    expect(document.documentElement.style.overflow).toBe("");
  });

  it("ignora a segunda chamada de quem já soltou", () => {
    lock();
    const releaseInner = lock();

    releaseInner();
    releaseInner();

    expect(document.documentElement.style.overflow).toBe("hidden");
  });
});
