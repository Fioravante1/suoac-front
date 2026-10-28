/**
 * Trava a rolagem da pagina enquanto um modal esta aberto.
 *
 * A trava vai no `<html>`, e nao no `<body>`: `globals.css` declara
 * `overflow-x: hidden` nos dois, o que faz do `<html>` o elemento que rola. Travar
 * o `<body>` nao tem efeito nenhum — a pagina continua rolando por tras do modal.
 *
 * Conta quantos pediram a trava. Dois modais abertos um sobre o outro e fechados
 * na mesma atualizacao devolveriam o estado na ordem errada se cada um guardasse
 * e restaurasse o seu, deixando a pagina travada para sempre.
 */
let lockCount = 0;
let savedOverflow = "";
let savedScrollbarGutter = "";

export function lockDocumentScroll(): () => void {
  const root = document.documentElement;

  if (lockCount === 0) {
    // Havia barra de rolagem? Se sim, o espaco dela fica reservado, para a pagina
    // nao pular de lado ao sumir. Se nao havia, reservar criaria o pulo.
    const hasScrollbar = window.innerWidth > root.clientWidth;

    savedOverflow = root.style.overflow;
    savedScrollbarGutter = root.style.getPropertyValue("scrollbar-gutter");
    root.style.overflow = "hidden";

    if (hasScrollbar) root.style.setProperty("scrollbar-gutter", "stable");
  }

  lockCount += 1;
  let isReleased = false;

  return function releaseDocumentScroll() {
    if (isReleased) return;

    isReleased = true;
    lockCount -= 1;

    if (lockCount > 0) return;

    root.style.overflow = savedOverflow;
    root.style.setProperty("scrollbar-gutter", savedScrollbarGutter);
  };
}
