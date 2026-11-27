"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useId } from "react";
import { Shield, House, LayoutGrid, Plus, Users, Wallet, type LucideIcon } from "lucide-react";

import type { Event } from "@/entities/event";
import { useSelectedEvent } from "@/features/select-event";
import { useAuthPermissions } from "@/shared/auth";
import { useModal } from "@/shared/lib";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { PANEL_NAV_IDS, getPanelNavItems, isPanelNavItemActive, useEventOverview, type PanelNavId } from "../../model";
import { EnrollPassengerDialog } from "../enroll-passenger-dialog";

import styles from "./panel-bottom-nav.module.css";

const PANEL_NAV_ICONS: Record<PanelNavId, LucideIcon> = {
  [PANEL_NAV_IDS.TEAM]: Shield,
  [PANEL_NAV_IDS.HOME]: House,
  [PANEL_NAV_IDS.PASSENGERS]: Users,
  [PANEL_NAV_IDS.FINANCIAL]: Wallet,
  [PANEL_NAV_IDS.MORE]: LayoutGrid,
};

/** O "+" fica entre Passageiros e Financeiro: dois itens de cada lado. */
const ITEMS_BEFORE_FAB = 2;

/**
 * A navegação inferior do celular e do tablet (`SUOAC Dashboard Mobile.dc.html`): Início,
 * Passageiros, o "+" de Cadastrar passageiro, Financeiro e Mais. No celular é a barra de vidro
 * colada na borda de baixo; no tablet, uma pílula flutuante. No desktop (a partir de 1280px) some.
 *
 * O item ativo vem da rota (`aria-current="page"`), e Mais fica ativo nas telas empilhadas atrás
 * dele. O "+" abre o cadastro de hoje, o mesmo do resumo e do dock, até a Fatia 4 (SUC-8); sem
 * inscrições abertas ele fica desabilitado, como o Cadastrar passageiro do resumo some.
 *
 * Um espaçador do tamanho da barra vem junto, para ela não cobrir o fim do conteúdo das telas.
 *
 * Navegação e escopo respeitam o papel do usuário autenticado. Precisa do
 * `SelectedEventProvider`, que o shell novo monta junto (SUC-115).
 */
export function PanelBottomNav() {
  const pathname = usePathname() ?? "";
  const { userRole } = useAuthPermissions();
  const selection = useSelectedEvent();
  const overview = useEventOverview();
  const enrollModal = useModal<Event>();
  const reasonId = useId();

  if (!userRole) return null;

  const items = getPanelNavItems(selection?.event?.id ?? null, userRole);
  const enrollableEvent = overview.status === "ready" && overview.canEnroll ? overview.event : null;
  const isEnrollDisabled = enrollableEvent === null;
  const disabledReason =
    overview.status === "ready"
      ? overview.enrollDisabledReason
      : "Nenhum evento com inscrições abertas está disponível.";

  function handleEnrollClick() {
    if (!enrollableEvent) return;

    // O evento fica guardado ao abrir: uma atualização em segundo plano, que fecha as inscrições ou troca
    // o evento, não pode desmontar o cadastro com o formulário a meio.
    enrollModal.open(enrollableEvent);
  }

  return (
    <>
      <nav className={styles.nav} aria-label="Painel">
        {items.map((item, index) => {
          const Icon = PANEL_NAV_ICONS[item.id];
          const isActive = isPanelNavItemActive(item, pathname);

          return (
            <Fragment key={item.id}>
              {index === ITEMS_BEFORE_FAB && (
                <div className={styles.cell}>
                  <button
                    type="button"
                    className={styles.fab}
                    aria-label="Cadastrar passageiro"
                    aria-disabled={isEnrollDisabled || undefined}
                    aria-describedby={isEnrollDisabled ? reasonId : undefined}
                    onClick={handleEnrollClick}
                  >
                    <Plus size={24} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                  {isEnrollDisabled && (
                    <span id={reasonId}>
                      <VisuallyHidden>{disabledReason}</VisuallyHidden>
                    </span>
                  )}
                </div>
              )}
              <div className={styles.cell}>
                <Link href={item.href} className={styles.item} aria-current={isActive ? "page" : undefined}>
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
                  {item.label}
                </Link>
              </div>
            </Fragment>
          );
        })}
      </nav>

      <div className={styles.spacer} aria-hidden="true" />

      {enrollModal.isOpen && enrollModal.item && (
        <EnrollPassengerDialog event={enrollModal.item} onClose={enrollModal.close} />
      )}
    </>
  );
}
