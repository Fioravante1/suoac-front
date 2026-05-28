"use server";

import { endpoints, httpClient } from "@/shared/api/http-client";

import type { Payment } from "../model";

export async function fetchPayments(eventPassengerId: string): Promise<Payment[]> {
  return httpClient<Payment[]>(endpoints.payments.list(eventPassengerId));
}
