/**
 * Versão dos termos de uso em vigor (SUC-86).
 *
 * É a data da "Última atualização" da página `/termos`, em `AAAA-MM-DD`, e é o
 * valor que o autocadastro e o aceite de convite enviam à API como
 * `termsVersion`. A página lê a data daqui, então **mudar o texto dos termos é
 * mudar esta constante**: não há outro lugar com a data, e o que a pessoa lê e o
 * que fica registrado não divergem.
 */
export const TERMS_VERSION = "2026-10-25";

/** `2026-10-25` → `25 de outubro de 2026`. UTC para o dia não recuar em fuso a oeste de Greenwich. */
export function formatTermsDate(version: string = TERMS_VERSION): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${version}T00:00:00Z`),
  );
}
