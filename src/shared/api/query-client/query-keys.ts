export const queryKeys = {
  all: ["suoac"] as const,
  congregations: {
    all: ["suoac", "congregations"] as const,
    list: (circuitId: string, page: number) => ["suoac", "congregations", "list", circuitId, page] as const,
    detail: (id: string) => ["suoac", "congregations", "detail", id] as const,
  },
  events: {
    all: ["suoac", "events"] as const,
    list: (circuitId: string, page: number) => ["suoac", "events", "list", circuitId, page] as const,
    detail: (id: string) => ["suoac", "events", "detail", id] as const,
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
    detail: (id: string) => ["suoac", "passengers", "detail", id] as const,
  },
};
