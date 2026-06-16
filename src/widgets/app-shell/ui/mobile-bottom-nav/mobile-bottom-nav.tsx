"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Wallet } from "lucide-react";

import { useAuthPermissions, filterNavItems, type NavItem } from "@/shared/auth";
import { signOutAction } from "@/features/sign-in";
import { routes } from "@/shared/config";

import { LogoutButton } from "../logout-button";
import { LogoutOverlay } from "../logout-overlay";
import styles from "./mobile-bottom-nav.module.css";

const mobileNavItems: NavItem[] = [
  { label: "Dashboard", href: routes.dashboard, icon: LayoutDashboard },
  { label: "Eventos", href: routes.events, icon: CalendarDays },
  { label: "Passageiros", href: routes.passengers, icon: Users },
  { label: "Financeiro", href: routes.financial, icon: Wallet, pending: true },
];

type MobileBottomNavProps = Readonly<{
  showPendingItems?: boolean;
}>;

export function MobileBottomNav({ showPendingItems = false }: MobileBottomNavProps) {
  const pathname = usePathname() ?? "";
  const { user } = useAuthPermissions();

  const visibleItems = user
    ? filterNavItems(mobileNavItems, user.role).filter((item) => showPendingItems || !item.pending)
    : [];

  return (
    <nav className={styles.nav}>
      {visibleItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link key={href} href={href} className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}>
            <Icon size={22} />
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
      <form action={signOutAction} className={styles.navItem}>
        <LogoutButton variant="stacked" />
        <LogoutOverlay />
      </form>
    </nav>
  );
}
