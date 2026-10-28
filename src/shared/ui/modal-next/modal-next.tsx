"use client";

import {
  type ReactNode,
  type RefObject,
  createContext,
  use,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { containTabKey, getFocusedElement, lockDocumentScroll, registerLayer, useIsClient } from "@/shared/lib";

import styles from "./modal-next.module.css";

/**
 * Como o modal se apresenta abaixo do desktop (`SUOAC Dashboard Mobile.dc.html`):
 *
 * - `sheet`: no celular sobe da borda inferior da tela, com alca; no tablet vira
 *   modal central de 540px. E o padrao de detalhes e acoes do painel.
 * - `wide`: no celular ocupa a tela inteira; no tablet vira modal de 620px com a
 *   altura da tela. Para conteudo longo, como cadastrar passageiro.
 *
 * No desktop do painel (a partir de 1280px) os dois viram o modal central do
 * `SUOAC Dashboard v3.dc.html`: cresce com o conteudo, e quem rola e o fundo.
 *
 * O que muda de modal para modal no desenho vem de quem usa, por variaveis
 * declaradas na classe passada em `className`:
 *
 * - `--modal-next-width`: largura no desktop (480 a 1040px no desenho; padrao 540px);
 * - `--modal-next-radius`: raio no desktop (padrao `--suoac-radius-modal`);
 * - `--modal-next-sheet-max-height`: altura maxima do sheet no celular (padrao 92dvh);
 * - `--modal-next-enter`: entrada do `wide` no celular (padrao o sheet; a busca
 *   usa `--suoac-animation-modal-wide-in`).
 *
 * Variavel, e nao propriedade direta, porque uma regra da classe de quem usa
 * empata em especificidade com as deste modulo, e vence quem o bundler puser por
 * ultimo.
 */
export type ModalNextVariant = "sheet" | "wide";

type ModalNextProps = Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: ModalNextVariant;
  className?: string;
  /**
   * Para onde o foco volta ao fechar. Sem ele, volta a quem tinha o foco quando o
   * modal abriu — o que nao serve quando quem abriu some junto, como um item de menu.
   */
  returnFocusRef?: RefObject<HTMLElement | null>;
}>;

const VARIANT_CLASS: Record<ModalNextVariant, string> = {
  sheet: styles.sheet,
  wide: styles.wide,
};

/** Quantos modais envolvem este na arvore: decide qual e o de cima na pilha de camadas. */
const ModalDepthContext = createContext(0);

export function ModalNext({
  open,
  onClose,
  title,
  children,
  footer,
  variant = "sheet",
  className,
  returnFocusRef,
}: ModalNextProps) {
  const isClient = useIsClient();
  const depth = use(ModalDepthContext);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [opener, setOpener] = useState<HTMLElement | null>(() => (open ? getFocusedElement() : null));
  const [wasOpen, setWasOpen] = useState(open);

  // Quem abriu e guardado ainda na renderizacao: um campo com `autoFocus` dentro
  // do modal toma o foco na montagem, antes de qualquer efeito rodar.
  const isOpening = open && !wasOpen;

  if (open !== wasOpen) setWasOpen(open);
  if (isOpening) setOpener(getFocusedElement());

  const close = useEffectEvent(onClose);
  const resolveReturnTarget = useEffectEvent(() => returnFocusRef?.current ?? opener);

  useEffect(() => {
    if (!open) return;

    return lockDocumentScroll();
  }, [open]);

  // Teclado ouvido no `document`, e nao no painel: o foco cai no `<body>` quando o
  // botao focado fica desabilitado ou some, e o `Esc` e o `Tab` precisam continuar
  // valendo. A pilha de camadas faz so o modal de cima reagir.
  useEffect(() => {
    const panel = panelRef.current;

    if (!open || !panel) return;

    const layer = registerLayer(depth);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!layer.isTopmost() || event.defaultPrevented || event.isComposing) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      containTabKey(event, panel);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      layer.release();
    };
  }, [open, isClient, depth]);

  useEffect(() => {
    const panel = panelRef.current;

    if (!open || !panel) return;

    const returnTarget = resolveReturnTarget();

    // Respeita o `autoFocus` de quem usa; sem ele, o foco vai para o painel, e o
    // leitor de tela anuncia o titulo.
    if (!panel.contains(document.activeElement)) panel.focus();

    return () => {
      // No StrictMode, o React desmonta e remonta o efeito sem tirar o painel da
      // tela; devolver o foco ali roubaria o do campo com `autoFocus`. Por isso o
      // foco so volta depois que o painel saiu de fato do documento.
      queueMicrotask(() => {
        if (panel.isConnected || !returnTarget?.isConnected) return;

        returnTarget.focus();
      });
    };
  }, [open, isClient]);

  if (!open || !isClient) return null;

  const isSheet = variant === "sheet";

  return createPortal(
    <div className={styles.root} data-variant={variant}>
      <div className={styles.scrim} aria-hidden="true" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={[styles.panel, VARIANT_CLASS[variant], className].filter(Boolean).join(" ")}
      >
        {isSheet && (
          <div className={styles.handle} aria-hidden="true" onClick={onClose}>
            <span className={styles.handleBar} />
          </div>
        )}

        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <ModalDepthContext value={depth + 1}>
          <div className={styles.body}>{children}</div>

          {footer && <footer className={styles.footer}>{footer}</footer>}
        </ModalDepthContext>
      </div>
    </div>,
    document.body,
  );
}
