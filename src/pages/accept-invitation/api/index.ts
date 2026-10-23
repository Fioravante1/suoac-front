/*
 * So a Server Action sai pelo barril: o fluxo de aceite e Client Component e o
 * importa daqui, e reexportar `load-invitation-action` e `welcome-cookie` — que
 * dependem de `server-only` e `next/headers` — arrastaria os dois para o bundle
 * do navegador. A pagina, que e Server Component, os importa direto da pasta.
 */
export { acceptInvitationAction } from "./accept-invitation-action";
export type { AcceptInvitationInput, AcceptInvitationResult } from "./accept-invitation-action";
