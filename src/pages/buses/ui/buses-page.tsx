import { Bus } from "lucide-react";

import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";

import styles from "./buses-page.module.css";

/**
 * Aba Ônibus do painel enquanto a Fatia 7 (SUC-11) não chega: não há tela nem API de ônibus,
 * e a aba mostra o que vem por aí em vez de levar a uma página vazia. Decisão do usuário em
 * 13/11/2026, no SUC-108.
 */
export function BusesPage() {
  return (
    <div className={styles.page}>
      <PageHeader title="Ônibus" description="Os ônibus de cada dia do evento e a ocupação das poltronas." />
      <EmptyState
        icon={<Bus size={48} aria-hidden="true" />}
        title="A gestão de ônibus está a caminho"
        description="Em breve, você vai cadastrar os ônibus de cada dia, distribuir os passageiros pelas poltronas e acompanhar a ocupação por aqui."
      />
    </div>
  );
}
