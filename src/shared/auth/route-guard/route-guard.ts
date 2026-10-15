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
 * Gate de autenticação server-side (Next 16 Proxy). Roda antes de a rota ser
 * renderizada e centraliza os redirects de acesso:
 *
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
