/**
 * Navega para um caminho interno **recarregando a pagina inteira**.
 *
 * E o oposto de `useRouter().push()`, e e de proposito: a navegacao suave
 * preserva o estado de cliente — cache do React Query, contextos, a arvore de
 * componentes —, e os pontos que usam isto existem justamente para sair de um
 * estado que nao serve mais: sessao expirada, troca de senha obrigatoria, tela
 * de erro. A recarga tambem faz o proxy reavaliar a sessao.
 *
 * Recebe um caminho e navega para a URL absoluta. Nao e truque para calar a
 * regra `@next/next/no-location-assign-relative-destination`, que existe para
 * empurrar navegacao suave a quem nao precisa de recarga: aqui a recarga e o
 * requisito, e a URL completa e a forma de dize-lo.
 *
 * So navega dentro do proprio site: um endereco que resolva para outra origem —
 * `//outro.site/login`, por exemplo, que o `URL` entende como protocolo
 * relativo — e ignorado, para um valor montado a partir de entrada de usuario
 * nunca virar redirecionamento aberto.
 *
 * So no navegador: nao ha o que recarregar no servidor, e a chamada la e ignorada.
 */
export function hardNavigate(path: string): void {
  if (typeof window === "undefined") return;

  const target = new URL(path, window.location.origin);

  if (target.origin !== window.location.origin) return;

  window.location.href = target.toString();
}
