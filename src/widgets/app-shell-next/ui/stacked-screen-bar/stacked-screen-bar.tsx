"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { useAuthPermissions } from "@/shared/auth";
import { routes } from "@/shared/config";

import { isStackedScreen } from "../../model";

import styles from "./stacked-screen-bar.module.css";

/**
 * A barra "‹ Mais" que o celular e o tablet mostram sob o topo nas telas empilhadas atrás de Mais:
 * Ônibus, Congregações e Listas e exportações (`SUOAC Dashboard Mobile.dc.html`). Leva de volta à
 * tela Mais. Nas outras rotas, e no desktop, não aparece.
 *
 * É do circuito, como o resto da navegação do celular e do tablet (SUC-113 faz a da congregação).
 */
export function StackedScreenBar() {
  const pathname = usePathname() ?? "";
  const { isCircuitUser } = useAuthPermissions();

  if (!isCircuitUser || !isStackedScreen(pathname)) return null;

  return (
    <div className={styles.bar}>
      <Link href={routes.more} className={styles.back}>
        <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
        Mais
      </Link>
    </div>
  );
}
