/**
 * Para onde vai o foco num menu quando uma tecla de navegação é pressionada, como no
 * padrão de menu do WAI-ARIA: as setas andam entre os itens e dão a volta nas pontas;
 * Home e End vão ao primeiro e ao último. Com o foco fora dos itens, a seta para baixo
 * entra pelo primeiro e a para cima pelo último. Outras teclas devolvem `null`.
 */
export function findMenuItemToFocus(
  items: readonly HTMLElement[],
  focused: Element | null,
  key: string,
): HTMLElement | null {
  const first = items.at(0) ?? null;
  const last = items.at(-1) ?? null;
  const index = items.findIndex((item) => item === focused);

  if (key === "Home") return first;
  if (key === "End") return last;
  if (key === "ArrowDown" && index === -1) return first;
  if (key === "ArrowUp" && index === -1) return last;
  if (key === "ArrowDown") return items.at((index + 1) % items.length) ?? null;
  if (key === "ArrowUp") return items.at(index - 1) ?? null;

  return null;
}
