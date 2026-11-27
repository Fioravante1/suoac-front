/** A rota é o próprio caminho ou uma subrota dele, como `/congregations/123` em `/congregations`. */
export function isUnderPath(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}
