"use server";

import { httpClient, endpoints } from "@/shared/api/http-client";

import type { PaginatedResponse } from "@/shared/api/http-client";

import type { Congregation } from "../model/congregation";

export async function fetchCongregations(
  circuitId: string,
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<Congregation>> {
  const url = `${endpoints.congregations.list(circuitId)}?page=${page}&limit=${limit}`;

  return httpClient<PaginatedResponse<Congregation>>(url);
}

export async function fetchCongregation(id: string): Promise<Congregation> {
  return httpClient<Congregation>(endpoints.congregations.detail(id));
}
