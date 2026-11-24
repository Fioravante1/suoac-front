export interface Congregation {
  id: string;
  code: string;
  name: string;
  email: string;
  city: string | null;
  isActive: boolean;
  circuitId: string;
  createdAt: string;
  updatedAt: string;
}

export const CONGREGATION_LIST_STATUSES = {
  PENDING: "PENDING",
  FINALIZED: "FINALIZED",
} as const;

export type CongregationListStatus = (typeof CONGREGATION_LIST_STATUSES)[keyof typeof CONGREGATION_LIST_STATUSES];

/** A lista de passageiros de uma congregação num evento: pendente até a congregação finalizá-la. */
export interface CongregationEventStatus {
  /** `null` enquanto a congregação nunca mexeu na lista: a API devolve o pendente sem registro. */
  id: string | null;
  status: CongregationListStatus;
  congregationId: string;
  congregationName: string;
  eventId: string;
  finalizedById: string | null;
  finalizedAt: string | null;
  createdAt: string;
}

/** Quantas congregações ainda não finalizaram a lista do evento. */
export function countUnfinalizedCongregations(statuses: readonly CongregationEventStatus[]): number {
  return statuses.filter((item) => item.status !== CONGREGATION_LIST_STATUSES.FINALIZED).length;
}
