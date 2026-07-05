import { afterEach, describe, expect, it, vi } from "vitest";
import { WhatsUsernamesApiError } from "./errors";
import { buildQuery, getBinary, getJson, postJson } from "./http";

const ctx = { baseUrl: "https://example.test" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildQuery", () => {
  it("omits undefined params and encodes the rest", () => {
    expect(buildQuery({ a: "1", b: undefined, c: 2 })).toBe("?a=1&c=2");
  });

  it("returns an empty string when there are no params", () => {
    expect(buildQuery({ a: undefined })).toBe("");
  });
});

describe("getJson", () => {
  it("fetches and parses a JSON response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getJson(ctx, "/api/v1/thing");

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/v1/thing");
    expect(result).toEqual({ ok: true });
  });

  it("throws WhatsUsernamesApiError on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "missing_username", message: "Required." } }), {
          status: 400,
        }),
      ),
    );

    await expect(getJson(ctx, "/api/v1/thing")).rejects.toMatchObject({
      status: 400,
      code: "missing_username",
      message: "Required.",
    });
  });
});

describe("postJson", () => {
  it("sends a JSON body via POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ valid: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await postJson(ctx, "/api/v1/business/bsuid/validate", { bsuid: "US.123" });

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/v1/business/bsuid/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bsuid: "US.123" }),
    });
    expect(result).toEqual({ valid: true });
  });

  it("throws WhatsUsernamesApiError on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "invalid_json", message: "Bad JSON." } }), { status: 400 }),
      ),
    );

    await expect(postJson(ctx, "/api/v1/business/bsuid/validate", {})).rejects.toBeInstanceOf(
      WhatsUsernamesApiError,
    );
  });
});

describe("getBinary", () => {
  it("returns raw bytes and content type", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(bytes, { status: 200, headers: { "Content-Type": "image/png" } })),
    );

    const result = await getBinary(ctx, "/api/v1/qr?username=joao");

    expect(result.contentType).toBe("image/png");
    expect(Array.from(result.body)).toEqual([1, 2, 3]);
  });

  it("throws WhatsUsernamesApiError on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "missing_target", message: "Provide a target." } }), {
          status: 400,
        }),
      ),
    );

    await expect(getBinary(ctx, "/api/v1/qr")).rejects.toMatchObject({ code: "missing_target" });
  });
});
