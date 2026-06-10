import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DashboardPaymentBreakdown } from "../dashboard-types";

import {
  daysUntilDeadline,
  DEADLINE_URGENCIES,
  getDeadlineUrgency,
  getGreetingByTime,
  totalFromBreakdown,
} from "./dashboard-utils";

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

describe("daysUntilDeadline", () => {
  it("retorna numero positivo para prazo futuro", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);

    expect(daysUntilDeadline(toLocalDateStr(future))).toBe(5);
  });

  it("retorna 0 para prazo hoje", () => {
    expect(daysUntilDeadline(toLocalDateStr(new Date()))).toBe(0);
  });

  it("retorna numero negativo para prazo passado", () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);

    expect(daysUntilDeadline(toLocalDateStr(past))).toBe(-3);
  });

  it("funciona com data ISO completa (com horario)", () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const dateStr = toLocalDateStr(future);
    const isoStr = `${dateStr}T15:00:00.000Z`;

    expect(daysUntilDeadline(isoStr)).toBe(5);
  });
});

describe("getDeadlineUrgency", () => {
  it("retorna 'expired' para dias negativos", () => {
    expect(getDeadlineUrgency(-1)).toBe(DEADLINE_URGENCIES.expired);
    expect(getDeadlineUrgency(-10)).toBe(DEADLINE_URGENCIES.expired);
  });

  it("retorna 'urgent' para 0 a 3 dias", () => {
    expect(getDeadlineUrgency(0)).toBe(DEADLINE_URGENCIES.urgent);
    expect(getDeadlineUrgency(1)).toBe(DEADLINE_URGENCIES.urgent);
    expect(getDeadlineUrgency(3)).toBe(DEADLINE_URGENCIES.urgent);
  });

  it("retorna 'approaching' para 4 a 7 dias", () => {
    expect(getDeadlineUrgency(4)).toBe(DEADLINE_URGENCIES.approaching);
    expect(getDeadlineUrgency(7)).toBe(DEADLINE_URGENCIES.approaching);
  });

  it("retorna 'safe' para mais de 7 dias", () => {
    expect(getDeadlineUrgency(8)).toBe(DEADLINE_URGENCIES.safe);
    expect(getDeadlineUrgency(30)).toBe(DEADLINE_URGENCIES.safe);
  });
});

describe("getGreetingByTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna 'Bom dia' de manha (antes das 12h)", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 9, 0, 0));

    expect(getGreetingByTime()).toBe("Bom dia");
  });

  it("retorna 'Boa tarde' a tarde (12h-17h)", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 14, 0, 0));

    expect(getGreetingByTime()).toBe("Boa tarde");
  });

  it("retorna 'Boa noite' a noite (18h+)", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 20, 0, 0));

    expect(getGreetingByTime()).toBe("Boa noite");
  });

  it("retorna 'Bom dia' a meia-noite", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 0, 0, 0));

    expect(getGreetingByTime()).toBe("Bom dia");
  });

  it("retorna 'Boa tarde' ao meio-dia", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 12, 0, 0));

    expect(getGreetingByTime()).toBe("Boa tarde");
  });
});

describe("totalFromBreakdown", () => {
  it("soma todos os campos do breakdown", () => {
    const breakdown: DashboardPaymentBreakdown = {
      paid: 10,
      partial: 5,
      pending: 3,
      exempt: 2,
    };

    expect(totalFromBreakdown(breakdown)).toBe(20);
  });

  it("retorna 0 quando todos os campos sao zero", () => {
    const breakdown: DashboardPaymentBreakdown = {
      paid: 0,
      partial: 0,
      pending: 0,
      exempt: 0,
    };

    expect(totalFromBreakdown(breakdown)).toBe(0);
  });
});
