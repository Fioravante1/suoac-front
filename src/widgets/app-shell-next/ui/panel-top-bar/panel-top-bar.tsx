"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, ChevronDown, Search } from "lucide-react";

import { formatCircuitName, ownCircuitOptions } from "@/entities/circuit";
import { EventStatusDot } from "@/entities/event";
import { EventSwitcherSheet, useEventSwitcher } from "@/features/select-event";
import { useQuery } from "@/shared/api";
import { useAuth, useAuthPermissions } from "@/shared/auth";
import { routes } from "@/shared/config";
import { getInitials } from "@/shared/lib";
import { Spinner } from "@/shared/ui/spinner";

import { ComingSoonButton } from "../coming-soon-button";

import styles from "./panel-top-bar.module.css";

/**
 * O topo do painel no celular e no tablet (`SUOAC Dashboard Mobile.dc.html`, abaixo de 1280px): o
 * circuito e o evento selecionado, que abre a sheet de eventos; busca e notificações, que esperam a
 * Fatia 9 (SUC-13); e o avatar, que leva à tela Mais. No desktop quem faz o papel é a faixa do evento.
 *
 * É do circuito: os papéis da congregação ganham a navegação deles no SUC-113.
 *
 * Precisa do `SelectedEventProvider`, que o shell novo monta junto (SUC-115).
 */
export function PanelTopBar() {
  const { user } = useAuth();
  const { isCircuitUser } = useAuthPermissions();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcher = useEventSwitcher({ isOpen: isSwitcherOpen });
  // O topo é do circuito: para os outros papéis ele não aparece, e a consulta do circuito não sai.
  const { data: circuit } = useQuery({
    ...ownCircuitOptions(user?.circuitId ?? ""),
    enabled: isCircuitUser && Boolean(user),
  });

  if (!user || !isCircuitUser) return null;

  const { current, isCurrentLoading, isSelecting } = switcher;
  const isCurrentPending = current === undefined && isCurrentLoading;
  const isCurrentUnavailable = current === undefined && !isCurrentLoading;
  const hasNoCurrent = current === null;

  return (
    <header className={styles.bar}>
      <button
        type="button"
        className={styles.event}
        aria-haspopup="dialog"
        aria-busy={isSelecting}
        onClick={() => setIsSwitcherOpen(true)}
        onPointerEnter={switcher.prefetchEvents}
        onFocus={switcher.prefetchEvents}
      >
        {circuit && <span className={styles.circuit}>{formatCircuitName(circuit)}</span>}
        <span className={styles.title}>
          {current && (
            <>
              <EventStatusDot variant={current.statusVariant} surface="navy" />
              <span className={styles.titleText}>{current.title}</span>
            </>
          )}
          {hasNoCurrent && (
            <>
              <EventStatusDot variant="neutral" surface="navy" />
              <span className={styles.titleText}>Nenhum evento ativo</span>
            </>
          )}
          {isCurrentPending && <span className={styles.titleText}>Carregando evento…</span>}
          {isCurrentUnavailable && <span className={styles.titleText}>Escolha um evento</span>}
          {isSelecting && <Spinner size="small" />}
          {!isSelecting && <ChevronDown className={styles.chevron} size={15} strokeWidth={2.2} aria-hidden="true" />}
        </span>
      </button>

      <ComingSoonButton icon={Search} label="Buscar" />
      <ComingSoonButton icon={Bell} label="Notificações" />

      <Link href={routes.more} className={styles.account} aria-label={`Conta de ${user.name}`}>
        <span className={styles.avatar} aria-hidden="true">
          {getInitials(user.name)}
        </span>
      </Link>

      <EventSwitcherSheet open={isSwitcherOpen} onClose={() => setIsSwitcherOpen(false)} />
    </header>
  );
}
