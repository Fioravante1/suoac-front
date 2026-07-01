import type { CongregationFinancial, FinancialSummary, FinancialTotals, PaymentStatusCounts } from "../../model";

/** Forma do backend para o resumo financeiro do evento. */
export interface FinancialSummaryDto {
  eventId: string;
  eventTitle: string;
  ticketPrice: string;
  totals: FinancialTotalsDto;
  congregations: CongregationFinancialDto[];
}

interface FinancialTotalsDto {
  totalPassengers: number;
  totalExpected: string;
  totalReceived: string;
  totalPending: string;
  byStatus: PaymentStatusCounts;
}

interface CongregationFinancialDto extends FinancialTotalsDto {
  congregationId: string;
  congregationName: string;
}

function mapTotals(dto: FinancialTotalsDto): FinancialTotals {
  return {
    totalPassengers: dto.totalPassengers,
    totalExpected: dto.totalExpected,
    totalReceived: dto.totalReceived,
    totalPending: dto.totalPending,
    byStatus: dto.byStatus,
  };
}

function mapCongregation(dto: CongregationFinancialDto): CongregationFinancial {
  return {
    congregationId: dto.congregationId,
    congregationName: dto.congregationName,
    ...mapTotals(dto),
  };
}

/** Converte o DTO do backend no model usado no frontend. */
export function mapFinancialSummary(dto: FinancialSummaryDto): FinancialSummary {
  return {
    eventId: dto.eventId,
    eventTitle: dto.eventTitle,
    ticketPrice: dto.ticketPrice,
    totals: mapTotals(dto.totals),
    congregations: dto.congregations.map(mapCongregation),
  };
}
