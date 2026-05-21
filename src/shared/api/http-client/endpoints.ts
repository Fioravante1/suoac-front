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
} as const;
