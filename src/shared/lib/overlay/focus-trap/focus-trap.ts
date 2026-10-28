/** Candidatos a receber foco; quem de fato recebe pelo Tab sai de `isTabbable`. */
const CANDIDATE_SELECTOR = [
  "a[href]",
  "button",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "[contenteditable='true']",
  "[tabindex]",
].join(",");

type TabKeyEvent = Readonly<{
  key: string;
  shiftKey: boolean;
  preventDefault: () => void;
}>;

/**
 * O Tab alcanca o elemento? Fica de fora o que tem `tabindex` negativo (como o
 * botao de mostrar senha do `PasswordField`), o desabilitado, o que esta dentro
 * de `inert` ou `hidden`, e o que nao aparece na tela. Fora do navegador, sem
 * `checkVisibility`, a visibilidade nao e conferida.
 */
function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0 || element.matches(":disabled")) return false;
  if (element.closest("[inert], [hidden]")) return false;
  if (typeof element.checkVisibility !== "function") return true;

  return element.checkVisibility({ visibilityProperty: true });
}

function isRadio(element: HTMLElement): element is HTMLInputElement {
  return element instanceof HTMLInputElement && element.type === "radio" && element.name !== "";
}

/**
 * Num grupo de radios, o Tab para uma vez so: no marcado, ou no primeiro quando
 * nenhum esta marcado. As setas andam entre os demais.
 */
function isRadioGroupStop(element: HTMLElement, tabbable: readonly HTMLElement[]): boolean {
  if (!isRadio(element)) return true;

  const group = tabbable.filter((other) => isRadio(other) && other.name === element.name) as HTMLInputElement[];
  const checked = group.find((radio) => radio.checked);

  return (checked ?? group.at(0)) === element;
}

/** Elementos que o Tab alcanca dentro do container, na ordem do documento. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const tabbable = Array.from(container.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR)).filter(isTabbable);

  return tabbable.filter((element) => isRadioGroupStop(element, tabbable));
}

/** O elemento com foco agora, ou `null` fora do navegador ou com o foco no `<body>`. */
export function getFocusedElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const active = document.activeElement;

  if (!(active instanceof HTMLElement) || active === document.body) return null;

  return active;
}

/**
 * Mantem o Tab dentro do container: do ultimo elemento volta ao primeiro, e o
 * Shift+Tab do primeiro vai ao ultimo. Foco que escapou do container — caiu no
 * `<body>` porque o botao focado ficou desabilitado, por exemplo — volta para
 * dentro. E o que faz um modal ser modal para quem navega pelo teclado.
 */
export function containTabKey(event: TabKeyEvent, container: HTMLElement): void {
  if (event.key !== "Tab") return;

  const focusable = getFocusableElements(container);
  const first = focusable.at(0);
  const last = focusable.at(-1);

  if (!first || !last) {
    event.preventDefault();
    container.focus();
    return;
  }

  const active = document.activeElement;
  const isOutside = !container.contains(active);
  const leavesBackward = event.shiftKey && (active === first || active === container || isOutside);
  const leavesForward = !event.shiftKey && (active === last || isOutside);

  if (leavesBackward) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (leavesForward) {
    event.preventDefault();
    first.focus();
  }
}
