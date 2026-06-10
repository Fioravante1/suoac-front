import { getGreetingByTime } from "@/shared/lib";

import styles from "./dashboard-greeting.module.css";

interface DashboardGreetingProps {
  userName: string;
  congregationName: string | null;
  isCircuitUser: boolean;
}

export function DashboardGreeting({ userName, congregationName, isCircuitUser }: DashboardGreetingProps) {
  const greeting = getGreetingByTime();
  const subtitle = congregationName ?? (isCircuitUser ? "Visao geral do circuito" : null);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>
        {greeting}, {userName}!
      </h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
