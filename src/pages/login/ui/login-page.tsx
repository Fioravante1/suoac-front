import { Suspense } from "react";
import Image from "next/image";
import { CalendarCheck, ClipboardList, Users, Bus } from "lucide-react";

import { SignInForm } from "@/features/sign-in";

import styles from "./login-page.module.css";

const journeySteps = [
  { icon: CalendarCheck, label: "Evento criado" },
  { icon: ClipboardList, label: "Inscrições abertas" },
  { icon: Users, label: "Passageiros registrados" },
  { icon: Bus, label: "Viagem realizada" },
];

export function LoginPage() {
  return (
    <div className={styles.page}>
      <aside className={styles.brand} aria-hidden="true">
        <div className={styles.brandGlow} />
        <div className={styles.brandInner}>
          <div className={styles.brandLogo}>
            <Image src="/logo.png" alt="" width={48} height={48} className={styles.brandLogoMark} unoptimized />
            <span className={styles.brandLogoText}>SUOAC</span>
          </div>

          <div className={styles.brandCopy}>
            <h1 className={styles.brandHeadline}>Coordenação inteligente para o arranjo de ônibus.</h1>
            <p className={styles.brandTagline}>
              Mais que um sistema, uma ferramenta para pensar, coordenar e organizar cada viagem.
            </p>
          </div>

          <div className={styles.journey}>
            <span className={styles.journeyKicker}>Sua jornada, simplificada</span>
            <ol className={styles.journeyList}>
              {journeySteps.map(({ icon: Icon, label }) => (
                <li key={label} className={styles.journeyStep}>
                  <span className={styles.journeyIcon}>
                    <Icon size={18} />
                  </span>
                  <span className={styles.journeyLabel}>{label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.formInner}>
          <div className={styles.mobileBrand}>
            <Image
              src="/logo.png"
              alt="Logo SUOAC"
              width={44}
              height={44}
              className={styles.mobileBrandMark}
              unoptimized
            />
            <span className={styles.mobileBrandText}>SUOAC</span>
          </div>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Bem-vindo de volta</h2>
            <p className={styles.formSubtitle}>Entre com suas credenciais para acessar o painel.</p>
          </div>

          <Suspense>
            <SignInForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
