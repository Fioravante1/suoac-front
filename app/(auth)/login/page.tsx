import type { Metadata } from "next";
import { LoginPage } from "@/pages/login";

export const metadata: Metadata = {
  title: "Entrar | SUOAC",
  description: "Faça login no SUOAC - Sistema Unificado de Ônibus para Assembleias e Congressos.",
};

export default function Page() {
  return <LoginPage />;
}
