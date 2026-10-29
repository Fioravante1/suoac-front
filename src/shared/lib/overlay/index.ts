// Apoio a conteudo sobreposto a pagina: modais, sheets, toasts e overlays.
export { containTabKey, getFocusedElement } from "./focus-trap";
export { registerLayer } from "./layer-stack";
export type { Layer } from "./layer-stack";
export { findMenuItemToFocus } from "./menu-navigation";
export { lockDocumentScroll } from "./scroll-lock";
export { useIsClient } from "./use-is-client";
export { useModal } from "./use-modal";
