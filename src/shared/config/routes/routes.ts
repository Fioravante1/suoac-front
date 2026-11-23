export const routes = {
  home: "/",
  login: "/login",
  privacy: "/privacidade",
  // Página e conteúdo pendentes no SUC-63; destino do aceite no autocadastro.
  terms: "/termos",
  help: "/ajuda",
  changePassword: "/change-password",
  resetPassword: "/reset-password",
  acceptInvitation: "/accept-invitation",
  dashboard: "/dashboard",
  events: "/events",
  eventDetail: (id: string) => `/events/${id}`,
  // Os inscritos do evento, na seção do detalhe. É o destino da aba Passageiros do painel novo até
  // a Fatia 4 (SUC-8) trazer a tela nova.
  eventEnrollments: (id: string) => `/events/${id}#inscricoes`,
  congregations: "/congregations",
  passengers: "/passengers",
  financial: "/financial",
  // Abas do painel novo que ainda esperam a fatia delas: Ônibus (Fatia 7) e Listas (Fatia 8).
  buses: "/buses",
  lists: "/lists",
  settings: "/settings",
} as const;
