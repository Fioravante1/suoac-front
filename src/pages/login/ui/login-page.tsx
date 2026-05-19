import Image from "next/image";

import { Card } from "@/shared/ui/card";
import { SignInForm } from "@/features/sign-in";

import styles from "./login-page.module.css";

export function LoginPage() {
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <Image src="/logo.png" alt="Logo SUOAC" width={48} height={48} className={styles.logoImage} />
            <span className={styles.logoText}>SUOAC</span>
          </div>
          <p className={styles.tagline}>Coordenação inteligente para o arranjo de ônibus.</p>
        </div>

        <SignInForm />
      </Card>
    </div>
  );
}
