import { afterEach, describe, expect, it, vi } from "vitest";
import { bsuidParse, bsuidValidate, contactResolve, usernameValidate, webhookNormalize } from "./business";

const ctx = { baseUrl: "https://example.test" };

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("bsuidValidate", () => {
  it("posts the bsuid and returns the validation result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ valid: true, isParent: false }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await bsuidValidate(ctx, { bsuid: "US.13491208655302741918" });

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/v1/business/bsuid/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bsuid: "US.13491208655302741918" }),
    });
    expect(result).toEqual({ valid: true, isParent: false });
  });
});

describe("bsuidParse", () => {
  it("posts the bsuid and returns the parsed result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ countryCode: "US", id: "13491208655302741918", isParent: false }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await bsuidParse(ctx, { bsuid: "US.13491208655302741918" });

    expect(result.countryCode).toBe("US");
  });

  it("throws WhatsUsernamesApiError for a malformed bsuid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: "invalid_bsuid", message: "Malformed BSUID." } }, 400)),
    );

    await expect(bsuidParse(ctx, { bsuid: "not-a-bsuid" })).rejects.toMatchObject({ code: "invalid_bsuid" });
  });
});

describe("usernameValidate", () => {
  it("posts the username and returns valid + reasons", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ valid: true, reasons: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await usernameValidate(ctx, { username: "joao.silva" });

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/v1/business/username/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "joao.silva" }),
    });
    expect(result).toEqual({ valid: true, reasons: [] });
  });
});

describe("contactResolve", () => {
  it("posts exactly one identifier and returns the resolved contact", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: "joao.silva",
        type: "username",
        username: "joao.silva",
        phone: null,
        bsuid: null,
        displayName: null,
        phoneKnown: false,
        bsuidKnown: false,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await contactResolve(ctx, { username: "joao.silva" });

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/v1/business/contact/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "joao.silva" }),
    });
    expect(result.type).toBe("username");
  });
});

describe("webhookNormalize", () => {
  it("posts the raw payload and returns normalized events", async () => {
    const rawPayload = { entry: [{ changes: [{ value: { messages: [], contacts: [] } }] }] };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ provider: "meta_cloud_api", events: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await webhookNormalize(ctx, rawPayload);

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/api/v1/business/webhook/normalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rawPayload),
    });
    expect(result.provider).toBe("meta_cloud_api");
  });

  it("throws WhatsUsernamesApiError with a 422 for an unrecognized shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: { code: "webhook_unrecognized_shape", message: "Payload does not match any known shape." } },
          422,
        ),
      ),
    );

    await expect(webhookNormalize(ctx, {})).rejects.toMatchObject({
      status: 422,
      code: "webhook_unrecognized_shape",
    });
  });
});
