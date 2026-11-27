import { routes } from "@/shared/config";

// Cada fatia acrescenta suas rotas até o LegacyThemeScope sair no SUC-14.
const REDESIGNED_ROUTES: readonly string[] = [routes.more];

/** A rota é o próprio caminho ou uma subrota dele, como `/congregations/123` em `/congregations`. */
export function isUnderPath(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** A contenção clara só sai das rotas cujo conteúdo já nasceu nos dois temas. */
export function isRedesignedRoute(pathname: string | null): boolean {
  if (!pathname) return false;

  return REDESIGNED_ROUTES.some((route) => isUnderPath(pathname, route));
}
