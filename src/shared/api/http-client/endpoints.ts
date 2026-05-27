export const endpoints = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
  },
  congregations: {
    list: (circuitId: string) => `/circuits/${circuitId}/congregations` as const,
    detail: (id: string) => `/congregations/${id}` as const,
    create: (circuitId: string) => `/circuits/${circuitId}/congregations` as const,
    update: (id: string) => `/congregations/${id}` as const,
    delete: (id: string) => `/congregations/${id}` as const,
  },
  events: {
    list: (circuitId: string) => `/circuits/${circuitId}/events` as const,
    detail: (id: string) => `/events/${id}` as const,
    create: (circuitId: string) => `/circuits/${circuitId}/events` as const,
    update: (id: string) => `/events/${id}` as const,
    updateStatus: (id: string) => `/events/${id}/status` as const,
    cancel: (id: string) => `/events/${id}/cancel` as const,
    delete: (id: string) => `/events/${id}` as const,
  },
  eventDays: {
    list: (eventId: string) => `/events/${eventId}/days` as const,
    detail: (id: string) => `/event-days/${id}` as const,
    update: (id: string) => `/event-days/${id}` as const,
    cancel: (id: string) => `/event-days/${id}/cancel` as const,
  },
  passengers: {
    list: (congregationId: string) => `/congregations/${congregationId}/passengers` as const,
    search: (congregationId: string) => `/congregations/${congregationId}/passengers/search` as const,
    detail: (id: string) => `/passengers/${id}` as const,
    create: (congregationId: string) => `/congregations/${congregationId}/passengers` as const,
    update: (id: string) => `/passengers/${id}` as const,
    delete: (id: string) => `/passengers/${id}` as const,
  },
  eventPassengers: {
    list: (eventId: string) => `/events/${eventId}/passengers` as const,
    create: (eventId: string) => `/events/${eventId}/passengers` as const,
    detail: (id: string) => `/event-passengers/${id}` as const,
    updateDays: (id: string) => `/event-passengers/${id}/days` as const,
    delete: (id: string) => `/event-passengers/${id}` as const,
  },
} as const;
