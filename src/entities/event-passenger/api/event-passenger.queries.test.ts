import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchEventPassengersFinancial } from "./event-passenger.queries";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    eventPassengers: {
      list: (eventId: string) => `/events/${eventId}/passengers`,
    },
  },
  httpClient: httpClientMock,
}));

describe("fetchEventPassengersFinancial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    httpClientMock.mockResolvedValue({ data: [], meta: {}, financialSummary: {} });
  });

  it("envia page e limit, sem paymentStatus quando ausente", async () => {
    await fetchEventPassengersFinancial("evt-1", 2);

    expect(httpClientMock).toHaveBeenCalledWith("/events/evt-1/passengers?page=2&limit=10");
  });

  it("inclui paymentStatus quando informado", async () => {
    await fetchEventPassengersFinancial("evt-1", 1, "PENDING");

    expect(httpClientMock).toHaveBeenCalledWith("/events/evt-1/passengers?page=1&limit=10&paymentStatus=PENDING");
  });
});
