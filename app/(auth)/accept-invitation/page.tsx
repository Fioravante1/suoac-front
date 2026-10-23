import type { Metadata } from "next";

import { AcceptInvitationPage } from "@/pages/accept-invitation";

export const metadata: Metadata = {
  title: "Aceitar convite | SUOAC",
  description: "Conclua seu cadastro no SUOAC pelo convite que você recebeu.",
  // O link chega por e-mail e carrega um token de uso unico: nada aqui deve ser
  // indexado nem seguido por robo.
  robots: { index: false, follow: false },
};

/**
 * Rota aberta pelo link do convite de congregacao.
 *
 * Sem fachada e sem flag, diferente de `/login`: nao ha versao legada desta
 * tela, e gatear a rota mataria convite valido caso uma flag fosse desligada
 * depois do envio do e-mail — ver SUC-27.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; status?: string | string[] }>;
}) {
  const { token, status } = await searchParams;

  return <AcceptInvitationPage token={token} status={status} />;
}
