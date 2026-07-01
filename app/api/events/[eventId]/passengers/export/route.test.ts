import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/features/export-event-passengers/api/export-event-passengers-response", () => ({
  exportEventPassengersResponse: vi.fn(),
}));

import { exportEventPassengersResponse } from "@/features/export-event-passengers/api/export-event-passengers-response";

import { GET } from "./route";

const exportMock = vi.mocked(exportEventPassengersResponse);

function makeRequest(url: string): NextRequest {
  return { nextUrl: new URL(url) } as NextRequest;
}

describe("GET /api/events/[eventId]/passengers/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aguarda params e repassa eventId + query (congregationId, variant, format)", async () => {
    const expected = new Response("ok", { status: 200 });
    exportMock.mockResolvedValue(expected);

    const request = makeRequest(
      "http://localhost/api/events/evt-1/passengers/export?congregationId=cong-9&variant=carrier&format=xlsx",
    );
    const result = await GET(request, { params: Promise.resolve({ eventId: "evt-1" }) });

    expect(exportMock).toHaveBeenCalledWith({
      eventId: "evt-1",
      congregationId: "cong-9",
      variant: "carrier",
      format: "xlsx",
    });
    expect(result).toBe(expected);
  });

  it("envia congregationId, variant e format undefined quando ausentes", async () => {
    exportMock.mockResolvedValue(new Response(null, { status: 200 }));

    const request = makeRequest("http://localhost/api/events/evt-2/passengers/export");
    await GET(request, { params: Promise.resolve({ eventId: "evt-2" }) });

    expect(exportMock).toHaveBeenCalledWith({
      eventId: "evt-2",
      congregationId: undefined,
      variant: undefined,
      format: undefined,
    });
  });
});
