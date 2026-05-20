"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Wallet, LogOut } from "lucide-react";

import { signOutAction } from "@/features/sign-in";
import { routes } from "@/shared/config";

import styles from "./mobile-bottom-nav.module.css";

const mobileNavItems = [
  { label: "Dashboard", href: routes.dashboard, icon: LayoutDashboard },
  { label: "Eventos", href: routes.events, icon: CalendarDays },
  { label: "Passageiros", href: routes.passengers, icon: Users },
  { label: "Financeiro", href: routes.financial, icon: Wallet },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className={styles.nav}>
      {mobileNavItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link key={href} href={href} className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}>
            <Icon size={22} />
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
      <form action={signOutAction} className={styles.navItem}>
        <button type="submit" className={styles.logoutButton} aria-label="Sair">
          <LogOut size={22} />
          <span className={styles.label}>Sair</span>
        </button>
      </form>
    </nav>
  );
}
