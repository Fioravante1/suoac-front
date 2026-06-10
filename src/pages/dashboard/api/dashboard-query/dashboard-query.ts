"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";

import type { DashboardData } from "../../model";

export async function fetchDashboard(eventId: string, congregationId?: string): Promise<DashboardData> {
  const base = endpoints.events.dashboard(eventId);
  const url = congregationId ? `${base}?congregationId=${congregationId}` : base;

  return httpClient<DashboardData>(url);
}
