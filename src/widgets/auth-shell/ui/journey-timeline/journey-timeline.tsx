import { Bus, CalendarCheck, ClipboardList, Users, type LucideIcon } from "lucide-react";

import styles from "./journey-timeline.module.css";

interface JourneyStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * As quatro etapas pelas quais um evento passa, na ordem em que acontecem.
 *
 * Nao sao dados de dominio e nao tem equivalente no backend: e a narrativa que o
 * painel de apresentacao conta a quem ainda nao entrou no sistema.
 */
const JOURNEY_STEPS: readonly JourneyStep[] = [
  { icon: CalendarCheck, title: "Evento criado", description: "Datas, local e valor definidos" },
  { icon: ClipboardList, title: "Inscrições abertas", description: "Congregações montam suas listas" },
  { icon: Users, title: "Passageiros registrados", description: "Poltronas e pagamentos organizados" },
  { icon: Bus, title: "Viagem realizada", description: "Embarque e rastreamento no dia" },
];

interface JourneyTimelineProps {
  className?: string;
}

/**
 * Linha do tempo das etapas do evento, animada em loop.
 *
 * A animacao e toda CSS, sem estado nem temporizador em JavaScript: a tela de
 * entrada e a primeira coisa que o navegador pinta, e um loop em JavaScript
 * continuaria consumindo tempo de processamento enquanto o usuario digita a
 * senha.
 *
 * O estado base dos itens e o estado **aceso**. A animacao em loop e o que os
 * apaga e reacende. Assim, quando ela nao roda — por preferencia de menos
 * movimento ou por CSS que nao carregou — a jornada aparece inteira e legivel,
 * em vez de sumir.
 */
export function JourneyTimeline({ className }: JourneyTimelineProps) {
  return (
    <section className={[styles.timeline, className].filter(Boolean).join(" ")}>
      <h2 className={styles.kicker}>Sua jornada, simplificada</h2>

      <ol className={styles.steps}>
        {JOURNEY_STEPS.map(({ icon: Icon, title, description }) => (
          <li key={title} className={styles.step}>
            <span className={styles.icon}>
              <Icon size={20} strokeWidth={1.8} aria-hidden />
            </span>
            <span className={styles.label}>
              <span className={styles.title}>{title}</span>
              <span className={styles.description}>{description}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
