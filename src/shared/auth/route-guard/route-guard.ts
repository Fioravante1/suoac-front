import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { routes } from "@/shared/config";

import { getSession } from "../session";

/**
 * Rotas acessíveis sem sessão. Todas as demais exigem autenticação.
 *
 * Privacidade e Ajuda entram aqui porque são alcançadas pelo rodapé da tela de
 * entrada: sem isso o gate as devolveria para `/login`, e o link do rodapé
 * pareceria quebrado mesmo com a página existindo.
 */
const PUBLIC_ROUTES: readonly string[] = [routes.login, routes.privacy, routes.help];

/**
 * Rotas abertas por link com token, acessiveis **com ou sem sessao**.
 *
 * Nao entram em `PUBLIC_ROUTES` porque rota publica, com sessao valida, e
 * redirecionada para o painel — e aqui isso quebraria o link. O caso que decide:
 * computador compartilhado, onde a sessao aberta pode ser de outra pessoa; mandar
 * para o painel dela, em vez de deixar redefinir a senha, erra duas vezes.
 *
 * Tambem vale para quem tem troca de senha obrigatoria pendente: redefinir pelo
 * link resolve a pendencia, entao prende-lo na tela de troca seria um beco.
 *
 * O aceite de convite (SUC-27) entra pelo mesmo motivo: o convidado pode abrir o
 * link num navegador com a sessao de outra pessoa, e o aceite abre a sessao dele.
 */
const TOKEN_LINK_ROUTES: readonly string[] = [routes.resetPassword, routes.acceptInvitation];

/**
 * Gate de autenticação server-side (Next 16 Proxy). Roda antes de a rota ser
 * renderizada e centraliza os redirects de acesso:
 *
 * - rota aberta por link com token → passa, com ou sem sessão;
 * - não autenticado em rota privada → `/login` (preservando `returnUrl`);
 * - autenticado com troca de senha obrigatória pendente → `/change-password`;
 * - autenticado na tela de login → `/dashboard`.
 *
 * É uma checagem **otimista**: lê apenas o cookie de sessão (assinado, portanto à
 * prova de adulteração). A defesa final dos dados continua no backend + no
 * `http-client` (que exige o access token). Complementa o `SessionGuard`, que
 * cobre a expiração de sessão durante o uso, sem navegação.
 */
export async function routeGuard(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;

  if (TOKEN_LINK_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isChangePasswordRoute = pathname === routes.changePassword;
  const session = await getSession();

  // Sem sessão válida: apenas rotas públicas são acessíveis.
  if (!session && isPublicRoute) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL(routes.login, req.nextUrl);
    loginUrl.searchParams.set("returnUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Troca de senha obrigatória pendente: prende o usuário na tela de definição de senha.
  if (session.mustChangePassword && !isChangePasswordRoute) {
    return NextResponse.redirect(new URL(routes.changePassword, req.nextUrl));
  }

  // Sem pendência: a tela de login e a própria tela de troca redirecionam para o app.
  if (!session.mustChangePassword && (isPublicRoute || isChangePasswordRoute)) {
    return NextResponse.redirect(new URL(routes.dashboard, req.nextUrl));
  }

  return NextResponse.next();
}
