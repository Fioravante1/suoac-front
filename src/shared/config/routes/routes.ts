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
  congregations: "/congregations",
  passengers: "/passengers",
  financial: "/financial",
  settings: "/settings",
} as const;
