export const routes = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
  events: "/events",
  eventDetail: (id: string) => `/events/${id}`,
  congregations: "/congregations",
  passengers: "/passengers",
  financial: "/financial",
  settings: "/settings",
} as const;
