import Image from "next/image";
import { KeyRound, Lock, LogOut, ShieldCheck } from "lucide-react";

import { ChangePasswordForm } from "@/features/change-password";
import { signOutAction } from "@/features/sign-in";
import { Button } from "@/shared/ui/button";

import styles from "./change-password-page.module.css";

const securityPoints = [
  { icon: KeyRound, label: "Escolha uma senha só sua" },
  { icon: Lock, label: "Substitui a senha temporária" },
  { icon: ShieldCheck, label: "Acesso pessoal e protegido" },
];

export function ChangePasswordPage() {
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
            <h1 className={styles.brandHeadline}>Sua conta, protegida desde o primeiro acesso.</h1>
            <p className={styles.brandTagline}>
              Defina uma senha pessoal e secreta para concluir seu acesso ao SUOAC com segurança.
            </p>
          </div>

          <ul className={styles.points}>
            {securityPoints.map(({ icon: Icon, label }) => (
              <li key={label} className={styles.point}>
                <span className={styles.pointIcon}>
                  <Icon size={18} />
                </span>
                <span className={styles.pointLabel}>{label}</span>
              </li>
            ))}
          </ul>
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
            <h2 className={styles.formTitle}>Defina sua senha</h2>
            <p className={styles.formSubtitle}>
              No primeiro acesso, crie uma nova senha antes de continuar para o sistema.
            </p>
          </div>

          <ChangePasswordForm />

          <form action={signOutAction} className={styles.logoutForm}>
            <Button type="submit" variant="secondary" fullWidth>
              <LogOut size={18} />
              Sair da conta
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
