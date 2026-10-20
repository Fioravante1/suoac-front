import type { Metadata } from "next";

import { ResetPasswordPage } from "@/pages/reset-password";

export const metadata: Metadata = {
  title: "Criar nova senha | SUOAC",
  description: "Defina uma nova senha para voltar a acessar o SUOAC.",
  // O link chega por e-mail e carrega um token de uso unico: nada aqui deve ser
  // indexado nem seguido por robo.
  robots: { index: false, follow: false },
};

/**
 * Rota aberta pelo link de recuperacao de senha.
 *
 * Sem fachada e sem flag, diferente de `/login`: nao ha versao legada desta
 * tela, e gatear a rota mataria link valido caso a flag `REDESIGN_LOGIN` fosse
 * desligada depois do envio do e-mail — ver SUC-26.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; status?: string | string[] }>;
}) {
  const { token, status } = await searchParams;

  return <ResetPasswordPage token={token} status={status} />;
}
