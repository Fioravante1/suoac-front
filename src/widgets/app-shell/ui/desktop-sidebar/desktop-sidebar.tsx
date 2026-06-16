"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Building2, Users, Wallet, Settings } from "lucide-react";

import { useAuthPermissions, filterNavItems, USER_ROLES, type NavItem } from "@/shared/auth";
import { signOutAction } from "@/features/sign-in";
import { routes } from "@/shared/config";

import { LogoutButton } from "../logout-button";
import { LogoutOverlay } from "../logout-overlay";
import styles from "./desktop-sidebar.module.css";

const navItems: NavItem[] = [
  { label: "Dashboard", href: routes.dashboard, icon: LayoutDashboard },
  { label: "Eventos", href: routes.events, icon: CalendarDays },
  {
    label: "Congregações",
    href: routes.congregations,
    icon: Building2,
    roles: [USER_ROLES.CIRCUIT_COORDINATOR, USER_ROLES.CIRCUIT_ASSISTANT],
  },
  { label: "Passageiros", href: routes.passengers, icon: Users },
  { label: "Financeiro", href: routes.financial, icon: Wallet, pending: true },
  {
    label: "Configurações",
    href: routes.settings,
    icon: Settings,
    roles: [USER_ROLES.CIRCUIT_COORDINATOR, USER_ROLES.CIRCUIT_ASSISTANT],
    pending: true,
  },
];

type DesktopSidebarProps = Readonly<{
  showPendingItems?: boolean;
}>;

export function DesktopSidebar({ showPendingItems = false }: DesktopSidebarProps) {
  const pathname = usePathname() ?? "";
  const { user } = useAuthPermissions();

  const visibleItems = user
    ? filterNavItems(navItems, user.role).filter((item) => showPendingItems || !item.pending)
    : [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Image
          src="/logo_sidebar_alternative.png"
          alt=""
          width={108}
          height={108}
          className={styles.logoIcon}
          unoptimized
          priority
        />
        <div className={styles.logoTextGroup}>
          <span className={styles.logoTitle}>SUOAC</span>
          <span className={styles.logoSubtitle}>Sistema Unificado de Ônibus para Assembleias e Congressos</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {visibleItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link key={href} href={href} className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}>
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <span className={styles.userName}>{user?.name ?? "Usuário"}</span>
        <form action={signOutAction}>
          <LogoutButton variant="icon" />
          <LogoutOverlay />
        </form>
      </div>
    </aside>
  );
}
