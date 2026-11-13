"use client";

import Image from "next/image";
import { Bell, Search } from "lucide-react";

import { formatCircuitName, ownCircuitOptions } from "@/entities/circuit";
import { EventSwitcherMenu } from "@/features/select-event";
import { useQuery } from "@/shared/api";
import { useAuth } from "@/shared/auth";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

import { AccountMenu } from "../account-menu";
import { ComingSoonButton } from "../coming-soon-button";

import styles from "./event-strip.module.css";

/**
 * Faixa fixa do evento no desktop (`SUOAC Dashboard v3.dc.html`, a partir de 1280px):
 * marca e circuito, seletor de evento, busca, notificações, tema e o menu da conta.
 *
 * Encerrar inscrições e Cadastrar passageiro não ficam aqui: no `v3` eles moram no resumo
 * do evento, logo abaixo (SUC-108 e SUC-109). Busca e notificações aguardam a Fatia 9
 * (SUC-13) e aparecem desabilitadas.
 *
 * Precisa do `SelectedEventProvider`, que o shell novo monta junto (SUC-115).
 */
export function EventStrip() {
  const { user } = useAuth();
  const { data: circuit } = useQuery(ownCircuitOptions(user?.circuitId ?? ""));

  return (
    <header className={styles.strip}>
      <div className={styles.brand}>
        <Image src="/logo-mark-dark.png" alt="" width={34} height={34} className={styles.brandMark} loading="eager" />
        <span className={styles.brandText}>
          <span className={styles.brandName}>SUOAC</span>
          {circuit && <span className={styles.brandScope}>{formatCircuitName(circuit)}</span>}
        </span>
      </div>

      <span className={styles.divider} aria-hidden="true" />

      <EventSwitcherMenu />

      <div className={styles.actions}>
        <ComingSoonButton icon={Search} label="Buscar" />
        <ComingSoonButton icon={Bell} label="Notificações" />
        <ThemeToggle className={styles.themeToggle} />
        <AccountMenu />
      </div>
    </header>
  );
}
