import { describe, expect, it } from "vitest";
import { createClient, WhatsUsernamesApiError } from "./index";

describe("package entry point", () => {
  it("exports createClient and WhatsUsernamesApiError", () => {
    expect(typeof createClient).toBe("function");
    expect(WhatsUsernamesApiError).toBeDefined();

    const client = createClient();
    expect(typeof client.usernameLink).toBe("function");
    expect(typeof client.business.bsuid.validate).toBe("function");
    expect(typeof client.business.webhook.normalize).toBe("function");
  });
});
