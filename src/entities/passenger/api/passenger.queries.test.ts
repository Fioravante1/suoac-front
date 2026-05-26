import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPassenger, fetchPassengers } from "./passenger.queries";

const httpClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http-client", () => ({
  endpoints: {
    passengers: {
      list: (congregationId: string) => `/congregations/${congregationId}/passengers`,
      search: (congregationId: string) => `/congregations/${congregationId}/passengers/search`,
      detail: (id: string) => `/passengers/${id}`,
    },
  },
  httpClient: httpClientMock,
}));

describe("passenger queries", () => {
  beforeEach(() => {
    httpClientMock.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
  });

  it("lista passageiros de uma congregação", async () => {
    await fetchPassengers("congregation-1", 2, 20);

    expect(httpClientMock).toHaveBeenCalledWith("/congregations/congregation-1/passengers?page=2&limit=20");
  });

  it("busca passageiros por nome ou RG", async () => {
    await fetchPassengers("congregation-1", 1, 20, "João");

    expect(httpClientMock).toHaveBeenCalledWith(
      "/congregations/congregation-1/passengers/search?page=1&limit=20&q=Jo%C3%A3o",
    );
  });

  it("busca detalhe de passageiro", async () => {
    await fetchPassenger("passenger-1");

    expect(httpClientMock).toHaveBeenCalledWith("/passengers/passenger-1");
  });
});
