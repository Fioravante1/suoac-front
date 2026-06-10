import { queryKeys } from "@/shared/api";

import { fetchDashboard } from "./dashboard-query";

export function dashboardOptions(eventId: string, congregationId?: string) {
  return {
    queryKey: queryKeys.dashboard.byEvent(eventId, congregationId),
    queryFn: () => fetchDashboard(eventId, congregationId),
    enabled: Boolean(eventId),
  } as const;
}
