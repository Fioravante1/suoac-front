/**
 * Reconhece a rejeicao que um `redirect` de Server Action produz no cliente.
 *
 * `redirect` sinaliza por excecao: a chamada da action rejeita **depois** de o
 * roteador ja ter aplicado a navegacao. Quem chama a action de dentro do
 * `handleSubmit` do React Hook Form precisa reconhece-la, porque o
 * `handleSubmit` repropaga o que o submit rejeitar — e a rejeicao vira
 * `unhandledrejection` no navegador: invisivel para quem usa a tela, mas alarme
 * falso em todo sucesso para quem coleta erro de cliente.
 *
 * Mora em `shared/lib` porque toda tela cujo sucesso termina em `redirect` tem
 * o mesmo problema, e as camadas nao permitem que `features` reuse o que esta
 * em `pages`.
 *
 * O digest e `NEXT_REDIRECT;<tipo>;<destino>;<status>;` — basta o prefixo, e
 * assim nao se importa modulo interno do Next.
 */
export function isRedirectRejection(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;

  const { digest } = error as { digest: unknown };

  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}
