import { queryKeys } from "@/shared/api";

import type { PaymentStatus } from "../model";

import { fetchEventPassenger, fetchEventPassengers, fetchEventPassengersFinancial } from "./event-passenger.queries";

export function eventPassengerListOptions(eventId: string, page: number) {
  return {
    queryKey: queryKeys.eventPassengers.list(eventId, page),
    queryFn: () => fetchEventPassengers(eventId, page),
    enabled: Boolean(eventId),
  } as const;
}

export function eventPassengersFinancialOptions(eventId: string, page: number, paymentStatus?: PaymentStatus) {
  return {
    queryKey: queryKeys.eventPassengers.financialList(eventId, page, paymentStatus ?? "ALL"),
    queryFn: () => fetchEventPassengersFinancial(eventId, page, paymentStatus),
    enabled: Boolean(eventId),
  } as const;
}

export function eventPassengerDetailOptions(id: string) {
  return {
    queryKey: queryKeys.eventPassengers.detail(id),
    queryFn: () => fetchEventPassenger(id),
    enabled: Boolean(id),
  } as const;
}
