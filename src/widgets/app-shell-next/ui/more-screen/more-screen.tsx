"use client";

import { Bus, FileText, Landmark, Lock, LogOut, Moon, ShieldCheck, type LucideIcon } from "lucide-react";

import { congregationEventStatusesOptions, countUnfinalizedCongregations } from "@/entities/congregation";
import { useSelectedEvent } from "@/features/select-event";
import { useQuery } from "@/shared/api";
import { USER_ROLE_LABELS, useAuth, useAuthPermissions } from "@/shared/auth";
import { getInitials } from "@/shared/lib";
import { useIsDarkTheme, useTheme } from "@/shared/theme";
import { LoadingOverlay } from "@/shared/ui/loading-overlay";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { MORE_SCREEN_IDS, MORE_SCREENS, useSignOut, type MoreScreenId } from "../../model";
import { AccountCircuit } from "../account-circuit";
import { MoreRow, type MoreRowTone } from "../more-row";

import styles from "./more-screen.module.css";

const SCREEN_ICONS: Record<MoreScreenId, LucideIcon> = {
  [MORE_SCREEN_IDS.BUSES]: Bus,
  [MORE_SCREEN_IDS.CONGREGATIONS]: Landmark,
  [MORE_SCREEN_IDS.LISTS]: FileText,
};

const SCREEN_TONES: Record<MoreScreenId, MoreRowTone> = {
  [MORE_SCREEN_IDS.BUSES]: "primary",
  [MORE_SCREEN_IDS.CONGREGATIONS]: "info",
  [MORE_SCREEN_IDS.LISTS]: "attention",
};

/** Apoio fixo do desenho. Ônibus fica sem apoio até a Fatia 7 (SUC-11): não há dado de ônibus. */
const SCREEN_HINTS: Partial<Record<MoreScreenId, string>> = {
  [MORE_SCREEN_IDS.LISTS]: "Embarque, pagamentos, WhatsApp",
};

/**
 * A tela Mais da navegação do celular e do tablet (`SUOAC Dashboard Mobile.dc.html`): o card da
 * conta, os atalhos do evento (Ônibus, Congregações, Listas e exportações), o tema escuro, Alterar
 * senha e Sair. No tablet as duas colunas dividem o que no celular é uma fila só.
 *
 * Os atalhos do evento são do circuito: o papel da congregação vê só a conta, o tema e Sair.
 * O card da conta é informativo: Meu perfil não tem tela (SUC-96, SUC-124). Alterar senha aparece
 * desabilitado, com "Em breve", como no menu da conta do desktop, até a troca voluntária
 * (SUC-125): `/change-password` é só a troca do primeiro acesso.
 */
export function MoreScreen() {
  const { user } = useAuth();
  const { isCircuitUser } = useAuthPermissions();
  const { toggle: toggleTheme } = useTheme();
  const isDark = useIsDarkTheme();
  const { signOut, isSigningOut } = useSignOut();
  const eventId = useSelectedEvent()?.event?.id ?? "";
  const statuses = useQuery({ ...congregationEventStatusesOptions(eventId), throwOnError: false });

  if (!user) return null;

  const finalized = statuses.data ? statuses.data.length - countUnfinalizedCongregations(statuses.data) : 0;
  const congregationsHint = statuses.data
    ? `${statuses.data.length} no circuito · ${finalized} ${finalized === 1 ? "finalizada" : "finalizadas"}`
    : undefined;

  return (
    <main>
      <h1>
        <VisuallyHidden>Mais</VisuallyHidden>
      </h1>

      <div className={styles.screen}>
        <section className={styles.account} aria-label="Dados da conta">
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">
              {getInitials(user.name)}
            </span>
            <span className={styles.identityText}>
              <span className={styles.name}>{user.name}</span>
              <span className={styles.email}>{user.email}</span>
            </span>
          </div>
          <span className={styles.privilege}>
            <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
            {USER_ROLE_LABELS[user.role]}
          </span>
          <AccountCircuit circuitId={user.circuitId} />
        </section>

        {isCircuitUser && (
          <section className={styles.group} aria-labelledby="more-event">
            <h2 id="more-event" className={styles.groupTitle}>
              Evento
            </h2>
            <div className={styles.rows}>
              {MORE_SCREENS.map((screen) => (
                <MoreRow
                  key={screen.id}
                  icon={SCREEN_ICONS[screen.id]}
                  tone={SCREEN_TONES[screen.id]}
                  label={screen.label}
                  hint={screen.id === MORE_SCREEN_IDS.CONGREGATIONS ? congregationsHint : SCREEN_HINTS[screen.id]}
                  href={screen.href}
                />
              ))}
            </div>
          </section>
        )}

        <section className={styles.group} aria-labelledby="more-account">
          <h2 id="more-account" className={styles.groupTitle}>
            Conta
          </h2>
          <div className={styles.rows}>
            <MoreRow
              icon={Moon}
              tone="neutral"
              label="Tema escuro"
              checked={isDark}
              onClick={toggleTheme}
              trailing={
                <span className={styles.track} data-on={isDark || undefined} aria-hidden="true">
                  <span className={styles.thumb} />
                </span>
              }
            />
            <MoreRow
              icon={Lock}
              tone="neutral"
              label="Alterar senha"
              isDisabled
              trailing={<span className={styles.soon}>Em breve</span>}
            />
            <MoreRow icon={LogOut} tone="critical" label="Sair" isBusy={isSigningOut} onClick={signOut} />
          </div>
        </section>
      </div>

      <LoadingOverlay open={isSigningOut} label="Saindo..." />
    </main>
  );
}
