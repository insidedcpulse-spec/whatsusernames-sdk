import { describe, expect, it } from "vitest";
import { WhatsUsernamesApiError } from "./errors";

describe("WhatsUsernamesApiError", () => {
  it("carries status, code, and message", () => {
    const err = new WhatsUsernamesApiError(400, "missing_username", 'Query param "username" is required.');

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("WhatsUsernamesApiError");
    expect(err.status).toBe(400);
    expect(err.code).toBe("missing_username");
    expect(err.message).toBe('Query param "username" is required.');
  });
});
