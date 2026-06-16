import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login"];
const CHANGE_PASSWORD_PATH = "/change-password";
const DEFAULT_PRIVATE_PATH = "/dashboard";

/**
 * Lê a flag de troca obrigatória do cookie de usuário (não-httpOnly, JSON).
 * Ausência/ erro de parse é tratado como `false` (token antigo sem a claim).
 */
function mustChangePassword(request: NextRequest): boolean {
  const userCookie = request.cookies.get("suoac-user")?.value;

  if (!userCookie) return false;

  try {
    return (JSON.parse(userCookie) as { mustChangePassword?: boolean }).mustChangePassword === true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has("suoac-access-token");
  const isPublicPath = publicPaths.some((path) => pathname === path);
  const isChangePasswordPath = pathname === CHANGE_PASSWORD_PATH;

  if (!hasToken && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!hasToken) {
    return NextResponse.next();
  }

  const pendingPasswordChange = mustChangePassword(request);

  // Troca de senha obrigatória prende o usuário na tela de definição de senha.
  if (pendingPasswordChange && !isChangePasswordPath) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, request.url));
  }

  // Sem pendência: login e a própria tela de troca redirecionam para o app.
  if (!pendingPasswordChange && (isPublicPath || isChangePasswordPath)) {
    return NextResponse.redirect(new URL(DEFAULT_PRIVATE_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api|.*\\.\\w+$).*)"],
};
