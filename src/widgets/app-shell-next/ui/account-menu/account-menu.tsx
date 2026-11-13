"use client";

import { useEffect, useId, useRef, useState, type FocusEvent } from "react";
import { ChevronDown, Lock, LogOut, ShieldCheck, UserRound } from "lucide-react";

import { USER_ROLE_LABELS, useAuth } from "@/shared/auth";
import { getInitials } from "@/shared/lib";
import { LoadingOverlay } from "@/shared/ui/loading-overlay";

import { useSignOut } from "../../model";
import { AccountCircuit } from "../account-circuit";

import styles from "./account-menu.module.css";

/**
 * Avatar da faixa do desktop e o menu da conta que ele abre (`SUOAC Dashboard v3.dc.html`):
 * quem está na sessão, o privilégio por extenso, o circuito, Meu perfil, Alterar senha e Sair.
 *
 * É um disclosure, não um menu de setas: o painel mistura informação e ações, e as ações
 * seguem a ordem do Tab logo depois do avatar. Esc fecha e devolve o foco ao avatar; clicar
 * fora ou levar o foco para fora também fecha.
 *
 * Meu perfil e Alterar senha ainda não têm destino e aparecem desabilitados, com "Em breve":
 * o perfil não tem tela (SUC-96, SUC-124), e `/change-password` é só a troca do primeiro
 * acesso, que a guarda de rota recusa a quem não tem troca pendente (SUC-125).
 */
export function AccountMenu() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, isSigningOut } = useSignOut();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Esc escuta o documento, não só o menu: no Safari, clicar num botão não o foca, e o
  // Esc depois de abrir com o mouse chegaria ao `body`, fora do menu.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;

      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      event.preventDefault();
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

  if (!user) return null;

  const initials = getInitials(user.name);

  // Sem `relatedTarget`, o foco foi para o corpo da página (um clique em texto do próprio
  // painel, por exemplo); o clique fora já é tratado pelo `pointerdown`.
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;

    if (!next || rootRef.current?.contains(next)) return;

    setIsOpen(false);
  }

  return (
    <div ref={rootRef} className={styles.root} onBlur={handleBlur}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={`Conta de ${user.name}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <ChevronDown className={styles.chevron} size={15} aria-hidden="true" />
      </button>

      {isOpen && (
        <div id={panelId} role="group" aria-label="Conta" className={styles.panel}>
          <div className={styles.identity}>
            <span className={styles.identityAvatar} aria-hidden="true">
              {initials}
            </span>
            <span className={styles.identityText}>
              <span className={styles.name}>{user.name}</span>
              <span className={styles.email}>{user.email}</span>
            </span>
          </div>

          <div className={styles.details}>
            <div className={styles.privilege}>
              <span className={styles.detailLabel}>Privilégio</span>
              <span className={styles.privilegeBadge}>
                <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
                {USER_ROLE_LABELS[user.role]}
              </span>
            </div>
            <hr className={styles.divider} />
            <AccountCircuit circuitId={user.circuitId} />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.action} aria-disabled="true">
              <UserRound size={16} strokeWidth={1.8} aria-hidden="true" />
              Meu perfil
              <span className={styles.soon}>Em breve</span>
            </button>
            <button type="button" className={styles.action} aria-disabled="true">
              <Lock size={16} strokeWidth={1.8} aria-hidden="true" />
              Alterar senha
              <span className={styles.soon}>Em breve</span>
            </button>
            <hr className={styles.separator} />
            <button
              type="button"
              className={`${styles.action} ${styles.signOut}`}
              onClick={signOut}
              disabled={isSigningOut}
              aria-busy={isSigningOut}
            >
              <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      )}

      <LoadingOverlay open={isSigningOut} label="Saindo..." />
    </div>
  );
}
