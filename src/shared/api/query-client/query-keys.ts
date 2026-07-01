export const queryKeys = {
  all: ["suoac"] as const,
  congregations: {
    all: ["suoac", "congregations"] as const,
    list: (circuitId: string, page: number) => ["suoac", "congregations", "list", circuitId, page] as const,
    select: (circuitId: string) => ["suoac", "congregations", "select", circuitId] as const,
    detail: (id: string) => ["suoac", "congregations", "detail", id] as const,
  },
  events: {
    all: ["suoac", "events"] as const,
    list: (circuitId: string, page: number) => ["suoac", "events", "list", circuitId, page] as const,
    select: (circuitId: string) => ["suoac", "events", "select", circuitId] as const,
    detail: (id: string) => ["suoac", "events", "detail", id] as const,
    activeByCircuit: (circuitId: string) => ["suoac", "events", "active", circuitId] as const,
  },
  eventDays: {
    all: ["suoac", "event-days"] as const,
    list: (eventId: string) => ["suoac", "event-days", "list", eventId] as const,
    detail: (id: string) => ["suoac", "event-days", "detail", id] as const,
  },
  passengers: {
    all: ["suoac", "passengers"] as const,
    list: (congregationId: string, page: number, search: string) =>
      ["suoac", "passengers", "list", congregationId, page, search] as const,
    listByCircuit: (circuitId: string, page: number, search: string, congregationId: string) =>
      ["suoac", "passengers", "listByCircuit", circuitId, page, search, congregationId] as const,
    detail: (id: string) => ["suoac", "passengers", "detail", id] as const,
  },
  eventPassengers: {
    all: ["suoac", "event-passengers"] as const,
    list: (eventId: string, page: number) => ["suoac", "event-passengers", "list", eventId, page] as const,
    financialList: (eventId: string, page: number, paymentStatus: string = "ALL") =>
      ["suoac", "event-passengers", "financial-list", eventId, page, paymentStatus] as const,
    detail: (id: string) => ["suoac", "event-passengers", "detail", id] as const,
  },
  payments: {
    all: ["suoac", "payments"] as const,
    list: (eventPassengerId: string) => ["suoac", "payments", "list", eventPassengerId] as const,
  },
  dashboard: {
    all: ["suoac", "dashboard"] as const,
    byEvent: (eventId: string, congregationId?: string) =>
      ["suoac", "dashboard", "byEvent", eventId, congregationId] as const,
  },
  financialSummary: {
    all: ["suoac", "financial-summary"] as const,
    byEvent: (eventId: string) => ["suoac", "financial-summary", "byEvent", eventId] as const,
  },
};
