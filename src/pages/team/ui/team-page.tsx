"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

import { useAuthPermissions } from "@/shared/auth";
import { routes } from "@/shared/config";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";

import styles from "./team-page.module.css";

/** Destino da aba Equipe até o SUC-74 implementar a gestão do assistente. */
export function TeamPage() {
  const { isCongregationCoordinator } = useAuthPermissions();
  const router = useRouter();
  useEffect(() => {
    if (!isCongregationCoordinator) router.replace(routes.dashboard);
  }, [isCongregationCoordinator, router]);
  if (!isCongregationCoordinator) return null;
  return (
    <div className={styles.page}>
      <PageHeader title="Equipe" description="A equipe do arranjo de ônibus na congregação." />
      <EmptyState
        icon={<Shield size={48} aria-hidden="true" />}
        title="A gestão da equipe está a caminho"
        description="Em breve, você poderá promover e gerenciar o assistente da congregação por aqui."
      />
    </div>
  );
}
