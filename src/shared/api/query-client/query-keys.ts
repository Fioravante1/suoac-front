export const queryKeys = {
  all: ["suoac"] as const,
  congregations: {
    all: ["suoac", "congregations"] as const,
    list: (circuitId: string, page: number) => ["suoac", "congregations", "list", circuitId, page] as const,
    detail: (id: string) => ["suoac", "congregations", "detail", id] as const,
  },
};
