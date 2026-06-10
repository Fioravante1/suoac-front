"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";

import type { PaginatedResponse } from "@/shared/api/http-client";

import type { Passenger } from "../model";

export async function fetchPassengers(
  congregationId: string,
  page: number = 1,
  limit: number = 10,
  search: string = "",
): Promise<PaginatedResponse<Passenger>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    params.set("q", trimmedSearch);
    return httpClient<PaginatedResponse<Passenger>>(`${endpoints.passengers.search(congregationId)}?${params}`);
  }

  return httpClient<PaginatedResponse<Passenger>>(`${endpoints.passengers.list(congregationId)}?${params}`);
}

export async function fetchCircuitPassengers(
  circuitId: string,
  page: number = 1,
  limit: number = 10,
  search: string = "",
  congregationId: string = "",
): Promise<PaginatedResponse<Passenger>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    params.set("q", trimmedSearch);
  }

  if (congregationId) {
    params.set("congregationId", congregationId);
  }

  return httpClient<PaginatedResponse<Passenger>>(`${endpoints.passengers.listByCircuit(circuitId)}?${params}`);
}

export async function fetchPassenger(id: string): Promise<Passenger> {
  return httpClient<Passenger>(endpoints.passengers.detail(id));
}
