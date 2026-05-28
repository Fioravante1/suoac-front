import { queryKeys } from "@/shared/api";

import { fetchPayments } from "./payment.queries";

export function paymentListOptions(eventPassengerId: string) {
  return {
    queryKey: queryKeys.payments.list(eventPassengerId),
    queryFn: () => fetchPayments(eventPassengerId),
    enabled: Boolean(eventPassengerId),
  } as const;
}
