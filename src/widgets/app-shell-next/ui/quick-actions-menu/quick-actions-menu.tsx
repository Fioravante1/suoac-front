"use client";

import { useEffect, useEffectEvent, useId, useRef, useState, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Download, Lock, LockOpen, Plus, type LucideIcon } from "lucide-react";

import type { Event } from "@/entities/event";
import { CloseRegistrationsDialog, useReopenRegistrations } from "@/features/event/close-registrations";
import { routes } from "@/shared/config";
import { useModal } from "@/shared/lib";

import {
  findShortcutAction,
  getQuickActions,
  REGISTRATION_ACTIONS,
  type QuickAction,
  type QuickActionId,
  type RegistrationAction,
} from "../../model";
import { EnrollPassengerDialog } from "../enroll-passenger-dialog";

import styles from "./quick-actions-menu.module.css";

/** O corte do desktop do painel (`--suoac-breakpoint-panel-desktop`): abaixo dele, o dock some. */
const DESKTOP_MEDIA_QUERY = "(min-width: 80rem)";

const OPEN_DIALOG_SELECTOR = "[role='dialog'][aria-modal='true']";

const QUICK_ACTION_ICONS: Record<QuickActionId, LucideIcon> = {
  enroll: Plus,
  payment: Banknote,
  export: Download,
  close: Lock,
  reopen: LockOpen,
};

type QuickActionsMenuProps = Readonly<{
  event: Event;
  canEnroll: boolean;
  registrationAction: RegistrationAction | null;
}>;

/**
 * O "+" do dock e o menu de ações rápidas que ele abre, com os atalhos de teclado.
 *
 * É um disclosure, como o menu da conta: o menu abre acima do "+", as ações seguem a ordem do
 * Tab, e Esc, o clique fora ou o foco fora o fecham.
 */
export function QuickActionsMenu({ event, canEnroll, registrationAction }: QuickActionsMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const enrollModal = useModal();
  const closeModal = useModal();
  const { reopen } = useReopenRegistrations(event.id);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const actions = getQuickActions({
    registrationDeadline: event.registrationDeadline,
    canEnroll,
    registrationAction,
  });

  const actionHandlers: Record<QuickActionId, () => void> = {
    enroll: enrollModal.open,
    payment: () => router.push(routes.eventEnrollments(event.id)),
    export: () => router.push(routes.lists),
    close: closeModal.open,
    reopen,
  };

  function runAction(action: QuickAction) {
    setIsOpen(false);
    actionHandlers[action.id]();
  }

  // O item escolhido some com o menu: o foco passa ao "+" antes, para o modal devolvê-lo ali.
  function chooseFromMenu(action: QuickAction) {
    triggerRef.current?.focus();
    runAction(action);
  }

  const handleShortcut = useEffectEvent((keyboardEvent: KeyboardEvent) => {
    if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return;

    const hasOpenDialog = document.querySelector(OPEN_DIALOG_SELECTOR) !== null;
    const action = findShortcutAction(keyboardEvent, actions, hasOpenDialog);

    if (!action) return;

    keyboardEvent.preventDefault();

    // Com o foco num item, o atalho vale como escolhê-lo: o item some, e o foco precisa de lugar.
    if (rootRef.current?.contains(document.activeElement)) {
      chooseFromMenu(action);
      return;
    }

    runAction(action);
  });

  useEffect(() => {
    document.addEventListener("keydown", handleShortcut);

    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  // Esc escuta o documento, não só o menu: no Safari, clicar num botão não o foca.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(pointerEvent: PointerEvent) {
      if (rootRef.current?.contains(pointerEvent.target as Node)) return;

      setIsOpen(false);
    }

    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key !== "Escape") return;

      keyboardEvent.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Sem `relatedTarget`, o foco foi para o corpo da página; o clique fora já é do `pointerdown`.
  function handleBlur(focusEvent: FocusEvent<HTMLDivElement>) {
    const next = focusEvent.relatedTarget;

    if (!next || rootRef.current?.contains(next)) return;

    setIsOpen(false);
  }

  return (
    <>
      <div ref={rootRef} className={styles.dock} onBlur={handleBlur}>
        {isOpen && (
          <div id={panelId} role="group" aria-label="Ações rápidas" className={styles.panel}>
            {actions.map((action) => {
              const Icon = QUICK_ACTION_ICONS[action.id];
              const labelId = `${panelId}-${action.id}-label`;
              const hintId = `${panelId}-${action.id}-hint`;

              return (
                <button
                  key={action.id}
                  type="button"
                  className={styles.item}
                  aria-labelledby={labelId}
                  aria-describedby={hintId}
                  aria-keyshortcuts={action.shortcut ?? undefined}
                  onClick={() => chooseFromMenu(action)}
                >
                  <span className={styles.glyph} aria-hidden="true">
                    <Icon size={17} strokeWidth={2} />
                  </span>
                  <span className={styles.text}>
                    <span id={labelId} className={styles.label}>
                      {action.label}
                    </span>
                    <span id={hintId} className={styles.hint}>
                      {action.hint}
                    </span>
                  </span>
                  {action.shortcut && (
                    <kbd className={styles.key} aria-hidden="true">
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          aria-label="Ação rápida"
          aria-expanded={isOpen}
          aria-controls={isOpen ? panelId : undefined}
          onClick={() => setIsOpen((open) => !open)}
        >
          <Plus className={styles.plus} size={24} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      {enrollModal.isOpen && <EnrollPassengerDialog event={event} onClose={enrollModal.close} />}
      {(registrationAction === REGISTRATION_ACTIONS.CLOSE || closeModal.isOpen) && (
        <CloseRegistrationsDialog event={event} open={closeModal.isOpen} onClose={closeModal.close} />
      )}
    </>
  );
}
