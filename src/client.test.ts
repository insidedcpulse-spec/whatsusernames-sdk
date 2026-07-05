import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient, DEFAULT_BASE_URL } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("createClient", () => {
  it("defaults to the production base URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ phone: "1", link: "https://wa.me/1" }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient();
    await client.phoneLink({ phone: "1" });

    expect(fetchMock).toHaveBeenCalledWith(`${DEFAULT_BASE_URL}/api/v1/phone-link?phone=1`);
  });

  it("uses a custom base URL when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ phone: "1", link: "http://localhost:3000/1" }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient({ baseUrl: "http://localhost:3000" });
    await client.phoneLink({ phone: "1" });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/v1/phone-link?phone=1");
  });

  it("exposes the business namespace with bsuid, username, contact, and webhook groups", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ valid: true, isParent: false }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createClient();
    const result = await client.business.bsuid.validate({ bsuid: "US.1" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${DEFAULT_BASE_URL}/api/v1/business/bsuid/validate`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({ valid: true, isParent: false });
  });
});
