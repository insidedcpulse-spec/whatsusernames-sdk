import { afterEach, describe, expect, it, vi } from "vitest";
import { WhatsUsernamesApiError } from "./errors";
import {
  openApiSpec,
  phoneLink,
  qr,
  usernameLink,
  validateKey,
  validatePhone,
  validateUsername,
} from "./consumer";

const ctx = { baseUrl: "https://example.test" };

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("usernameLink", () => {
  it("builds the query string from username, key, and text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        username: "joao.silva",
        link: "https://wa.me/joao.silva",
        shortLink: "https://whatsusernames.link/joao.silva",
        notice: "...",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await usernameLink(ctx, { username: "joao.silva", key: "AB12", text: "hi" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/api/v1/username-link?username=joao.silva&key=AB12&text=hi",
    );
    expect(result.link).toBe("https://wa.me/joao.silva");
  });

  it("throws on a validation error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: "username_length", message: "Username must be 3-35 characters." } }, 400),
      ),
    );

    await expect(usernameLink(ctx, { username: "a" })).rejects.toBeInstanceOf(WhatsUsernamesApiError);
  });
});

describe("phoneLink", () => {
  it("builds the query string from phone and text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ phone: "351912345678", link: "https://wa.me/351912345678" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await phoneLink(ctx, { phone: "351912345678" });

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/v1/phone-link?phone=351912345678");
    expect(result.link).toBe("https://wa.me/351912345678");
  });
});

describe("validateUsername / validateKey / validatePhone", () => {
  it("validateUsername hits /validate/username with the right query", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ valid: true, errors: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await validateUsername(ctx, { username: "joao.silva" });

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/v1/validate/username?username=joao.silva");
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("validateKey hits /validate/key with the right query", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ valid: true, errors: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await validateKey(ctx, { key: "AB12" });

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/v1/validate/key?key=AB12");
  });

  it("validatePhone hits /validate/phone with the right query", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ valid: true, errors: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await validatePhone(ctx, { phone: "351912345678" });

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/v1/validate/phone?phone=351912345678");
  });
});

describe("qr", () => {
  it("fetches binary QR data with the right query", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(bytes, { status: 200, headers: { "Content-Type": "image/png" } })),
    );

    const result = await qr(ctx, { username: "joao.silva", format: "png" });

    expect(result.contentType).toBe("image/png");
    expect(Array.from(result.body)).toEqual([1, 2, 3]);
  });
});

describe("openApiSpec", () => {
  it("fetches the raw OpenAPI document", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ openapi: "3.1.0" }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await openApiSpec(ctx);

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/v1/openapi.json");
    expect(result).toEqual({ openapi: "3.1.0" });
  });
});
