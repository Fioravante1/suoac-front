"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SelectedEventProvider } from "@/features/select-event";
import { LegacyThemeScope } from "@/shared/theme";

import { isRedesignedRoute } from "../../model";
import { EventStrip } from "../event-strip";
import { EventSummary } from "../event-summary";
import { PanelTopBar } from "../panel-top-bar";
import { StackedScreenBar } from "../stacked-screen-bar";
import { EventHomeHero } from "../event-home-hero";
import { PanelEventState } from "../panel-event-state";
import { PanelBottomNav } from "../panel-bottom-nav";
import { QuickActionsDock } from "../quick-actions-dock";

import styles from "./app-shell-next.module.css";

/**
 * Fronteira cliente da fachada privada: mantém o provider do evento no grafo cliente e
 * deixa o shell e os estados novos fora da contenção clara das telas ainda v1.
 *
 * O respiro do conteúdo é o do `main` do handoff, e vale para as telas v1 e para os estados
 * alternativos do Início. A tela Mais traz o próprio.
 */
export function AppShellNext({ children }: Readonly<{ children: ReactNode }>) {
  const isRedesigned = isRedesignedRoute(usePathname());

  return (
    <SelectedEventProvider>
      <div className={styles.shell}>
        <EventStrip />
        <EventSummary />
        <PanelTopBar />
        <StackedScreenBar />
        <div className={styles.body}>
          <EventHomeHero />
          <PanelEventState className={styles.content}>
            {isRedesigned ? (
              children
            ) : (
              <LegacyThemeScope>
                <div className={styles.content}>{children}</div>
              </LegacyThemeScope>
            )}
          </PanelEventState>
        </div>
        <PanelBottomNav />
        <QuickActionsDock />
      </div>
    </SelectedEventProvider>
  );
}
