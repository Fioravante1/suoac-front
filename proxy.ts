import { NextResponse, type NextRequest } from "next/server";

import { routeGuard } from "@/shared/auth/route-guard";
import { buildContentSecurityPolicy, generateNonce } from "@/shared/security";

const CSP_HEADER = "Content-Security-Policy";

/**
 * Next.js 16 Proxy (antigo Middleware). Compõe dois concerns testáveis:
 *
 * 1. `routeGuard` — gate de autenticação (lê o cookie de sessão assinado);
 * 2. CSP por nonce — gerada por requisição e aplicada às respostas que renderizam
 *    página (o Next lê o header CSP da requisição e aplica o nonce nos próprios
 *    scripts no SSR). Headers de segurança estáticos ficam no `next.config.ts`.
 *
 * O `matcher` precisa ser literal estático para ser analisado em build-time.
 * Exclui assets do Next, arquivos com extensão e rotas de API (que fazem a própria
 * checagem de sessão e respondem JSON, não devendo ser redirecionadas).
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const decision = await routeGuard(request);

  // Redirects não renderizam página — devolve sem nonce/CSP.
  if (decision.headers.has("location")) {
    return decision;
  }

  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(CSP_HEADER, csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CSP_HEADER, csp);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api|.*\\.\\w+$).*)"],
};
