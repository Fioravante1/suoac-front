import type { Metadata } from "next";

import { ChangePasswordPage } from "@/pages/change-password";

export const metadata: Metadata = {
  title: "Defina sua senha | SUOAC",
  description: "Crie sua nova senha para acessar o SUOAC.",
};

export default function Page() {
  return <ChangePasswordPage />;
}
