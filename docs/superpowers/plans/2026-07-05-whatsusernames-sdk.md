# whatsusernames-sdk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish `whatsusernames-sdk`, a zero-dependency TypeScript client for all 12 endpoints of the WhatsUsernames.link API (consumer link/QR/validation + Business Platform BSUID/username/contact/webhook), to npm.

**Architecture:** A factory function `createClient(options?)` returns a plain object of methods. Internally, a small `http.ts` layer wraps native `fetch` for GET/POST JSON and binary responses, throwing a typed `WhatsUsernamesApiError` on any non-2xx response. Method implementations are grouped by domain (`consumer.ts`, `business.ts`) and composed into the client shape in `client.ts`. Dual ESM/CJS build via `tsup`.

**Tech Stack:** TypeScript (strict), Vitest (mocked `fetch`), tsup (build), ESLint + typescript-eslint, npm (package manager + publish), GitHub Actions (CI).

---

## File structure

```
whatsusernames-sdk/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── eslint.config.mjs
├── .gitignore
├── README.md
├── LICENSE
├── .github/workflows/ci.yml
└── src/
    ├── errors.ts          # WhatsUsernamesApiError
    ├── errors.test.ts
    ├── http.ts            # ClientContext, buildQuery, getJson, postJson, getBinary
    ├── http.test.ts
    ├── types.ts           # all request/response types
    ├── consumer.ts        # 7 consumer-endpoint functions
    ├── consumer.test.ts
    ├── business.ts        # 5 business-endpoint functions
    ├── business.test.ts
    ├── client.ts           # createClient() composing consumer.ts + business.ts
    ├── client.test.ts
    ├── index.ts            # public exports
    └── index.test.ts
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `eslint.config.mjs`
- Create: `.gitignore`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "whatsusernames-sdk",
  "version": "0.1.0",
  "description": "TypeScript/JavaScript client SDK for the WhatsUsernames.link API — WhatsApp username links, QR codes, and Business Platform BSUID/webhook tools.",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  },
  "files": ["dist"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/insidedcpulse-spec/whatsusernames-sdk.git"
  },
  "homepage": "https://whatsusernames.link/developers",
  "keywords": ["whatsapp", "api", "sdk", "bsuid", "whatsapp-business", "qr-code"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "@eslint/js": "^9",
    "@types/node": "^20",
    "eslint": "^9",
    "tsup": "^8",
    "typescript": "^5",
    "typescript-eslint": "^8",
    "vitest": "^4"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
});
```

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 5: Write `eslint.config.mjs`**

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
  ignores: ["dist/**"],
});
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules/
dist/
*.log
.DS_Store
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` generated, no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsup.config.ts vitest.config.ts eslint.config.mjs .gitignore
git commit -m "chore: project scaffold (package.json, tsconfig, tsup, vitest, eslint)"
```

---

### Task 2: Error type

**Files:**
- Create: `src/errors.ts`
- Test: `src/errors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/errors.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/errors.test.ts`
Expected: FAIL — `Cannot find module './errors'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/errors.ts
export class WhatsUsernamesApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "WhatsUsernamesApiError";
    this.status = status;
    this.code = code;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/errors.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/errors.ts src/errors.test.ts
git commit -m "feat: add WhatsUsernamesApiError"
```

---

### Task 3: HTTP layer

**Files:**
- Create: `src/http.ts`
- Test: `src/http.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/http.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/http.test.ts`
Expected: FAIL — `Cannot find module './http'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/http.ts
import { WhatsUsernamesApiError } from "./errors";

export interface ClientContext {
  baseUrl: string;
}

async function throwApiError(response: Response): Promise<never> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new WhatsUsernamesApiError(response.status, "unknown_error", response.statusText || "Request failed.");
  }

  const error = (body as { error?: { code?: string; message?: string } }).error;
  throw new WhatsUsernamesApiError(
    response.status,
    error?.code ?? "unknown_error",
    error?.message ?? "Request failed.",
  );
}

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function getJson<T>(ctx: ClientContext, path: string): Promise<T> {
  const response = await fetch(`${ctx.baseUrl}${path}`);
  if (!response.ok) await throwApiError(response);
  return (await response.json()) as T;
}

export async function postJson<T>(ctx: ClientContext, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${ctx.baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) await throwApiError(response);
  return (await response.json()) as T;
}

export async function getBinary(ctx: ClientContext, path: string): Promise<{ body: Uint8Array; contentType: string }> {
  const response = await fetch(`${ctx.baseUrl}${path}`);
  if (!response.ok) await throwApiError(response);
  const buffer = await response.arrayBuffer();
  return {
    body: new Uint8Array(buffer),
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/http.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/http.ts src/http.test.ts
git commit -m "feat: add http layer (buildQuery, getJson, postJson, getBinary)"
```

---

### Task 4: Domain types

**Files:**
- Create: `src/types.ts`

No test file — this is a pure type-declaration file with no runtime behavior. Correctness is verified by `tsc --noEmit` and by every later task that imports these types compiling successfully.

- [ ] **Step 1: Write `src/types.ts`**

```ts
export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface UsernameLinkResult {
  username: string;
  key?: string;
  link: string;
  shortLink: string;
  notice: string;
}

export interface PhoneLinkResult {
  phone: string;
  link: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ApiErrorDetail[];
}

export interface QrOptions {
  username?: string;
  phone?: string;
  text?: string;
  format?: "png" | "svg";
  size?: number;
  color?: string;
  bg?: string;
}

export interface QrResult {
  body: Uint8Array;
  contentType: string;
}

export interface BsuidValidation {
  valid: boolean;
  isParent: boolean;
}

export interface BsuidParse {
  countryCode: string;
  id: string;
  isParent: boolean;
}

export interface BusinessUsernameValidation {
  valid: boolean;
  reasons: string[];
}

export type ContactType = "bsuid" | "phone" | "username";

export interface ResolvedContact {
  id: string;
  type: ContactType;
  username: string | null;
  phone: string | null;
  bsuid: string | null;
  displayName: string | null;
  phoneKnown: boolean;
  bsuidKnown: boolean;
}

export type NormalizedEventKind = "message" | "status";

export interface NormalizedEvent {
  kind: NormalizedEventKind;
  bsuid: string | null;
  phone: string | null;
  username: string | null;
  displayName: string | null;
  raw: unknown;
}

export interface NormalizedWebhook {
  provider: "meta_cloud_api";
  events: NormalizedEvent[];
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors (currently nothing imports these types yet, so this only checks `types.ts` itself is syntactically valid).

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add domain types for consumer and business API responses"
```

---

### Task 5: Consumer endpoint methods

**Files:**
- Create: `src/consumer.ts`
- Test: `src/consumer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/consumer.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/consumer.test.ts`
Expected: FAIL — `Cannot find module './consumer'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/consumer.ts
import type { ClientContext } from "./http";
import { buildQuery, getBinary, getJson } from "./http";
import type { PhoneLinkResult, QrOptions, QrResult, UsernameLinkResult, ValidationResult } from "./types";

export function usernameLink(
  ctx: ClientContext,
  params: { username: string; key?: string; text?: string },
): Promise<UsernameLinkResult> {
  return getJson(ctx, `/api/v1/username-link${buildQuery(params)}`);
}

export function phoneLink(ctx: ClientContext, params: { phone: string; text?: string }): Promise<PhoneLinkResult> {
  return getJson(ctx, `/api/v1/phone-link${buildQuery(params)}`);
}

export function validateUsername(ctx: ClientContext, params: { username: string }): Promise<ValidationResult> {
  return getJson(ctx, `/api/v1/validate/username${buildQuery(params)}`);
}

export function validateKey(ctx: ClientContext, params: { key: string }): Promise<ValidationResult> {
  return getJson(ctx, `/api/v1/validate/key${buildQuery(params)}`);
}

export function validatePhone(ctx: ClientContext, params: { phone: string }): Promise<ValidationResult> {
  return getJson(ctx, `/api/v1/validate/phone${buildQuery(params)}`);
}

export function qr(ctx: ClientContext, options: QrOptions): Promise<QrResult> {
  return getBinary(ctx, `/api/v1/qr${buildQuery(options)}`);
}

export function openApiSpec(ctx: ClientContext): Promise<unknown> {
  return getJson(ctx, "/api/v1/openapi.json");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/consumer.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/consumer.ts src/consumer.test.ts
git commit -m "feat: add consumer endpoint methods (link, validate, qr, openapi)"
```

---

### Task 6: Business Platform endpoint methods

**Files:**
- Create: `src/business.ts`
- Test: `src/business.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/business.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/business.test.ts`
Expected: FAIL — `Cannot find module './business'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/business.ts
import type { ClientContext } from "./http";
import { postJson } from "./http";
import type {
  BsuidParse,
  BsuidValidation,
  BusinessUsernameValidation,
  NormalizedWebhook,
  ResolvedContact,
} from "./types";

export function bsuidValidate(ctx: ClientContext, params: { bsuid: string }): Promise<BsuidValidation> {
  return postJson(ctx, "/api/v1/business/bsuid/validate", params);
}

export function bsuidParse(ctx: ClientContext, params: { bsuid: string }): Promise<BsuidParse> {
  return postJson(ctx, "/api/v1/business/bsuid/parse", params);
}

export function usernameValidate(
  ctx: ClientContext,
  params: { username: string },
): Promise<BusinessUsernameValidation> {
  return postJson(ctx, "/api/v1/business/username/validate", params);
}

export function contactResolve(
  ctx: ClientContext,
  params: { bsuid?: string; phone?: string; username?: string },
): Promise<ResolvedContact> {
  return postJson(ctx, "/api/v1/business/contact/resolve", params);
}

export function webhookNormalize(ctx: ClientContext, payload: unknown): Promise<NormalizedWebhook> {
  return postJson(ctx, "/api/v1/business/webhook/normalize", payload);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/business.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/business.ts src/business.test.ts
git commit -m "feat: add Business Platform endpoint methods (bsuid, username, contact, webhook)"
```

---

### Task 7: Client factory

**Files:**
- Create: `src/client.ts`
- Test: `src/client.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/client.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/client.test.ts`
Expected: FAIL — `Cannot find module './client'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/client.ts
import { bsuidParse, bsuidValidate, contactResolve, usernameValidate, webhookNormalize } from "./business";
import { openApiSpec, phoneLink, qr, usernameLink, validateKey, validatePhone, validateUsername } from "./consumer";
import type { ClientContext } from "./http";
import type {
  BsuidParse,
  BsuidValidation,
  BusinessUsernameValidation,
  NormalizedWebhook,
  PhoneLinkResult,
  QrOptions,
  QrResult,
  ResolvedContact,
  UsernameLinkResult,
  ValidationResult,
} from "./types";

export const DEFAULT_BASE_URL = "https://whatsusernames.link";

export interface CreateClientOptions {
  baseUrl?: string;
}

export interface WhatsUsernamesClient {
  usernameLink(params: { username: string; key?: string; text?: string }): Promise<UsernameLinkResult>;
  phoneLink(params: { phone: string; text?: string }): Promise<PhoneLinkResult>;
  validateUsername(params: { username: string }): Promise<ValidationResult>;
  validateKey(params: { key: string }): Promise<ValidationResult>;
  validatePhone(params: { phone: string }): Promise<ValidationResult>;
  qr(options: QrOptions): Promise<QrResult>;
  openApiSpec(): Promise<unknown>;
  business: {
    bsuid: {
      validate(params: { bsuid: string }): Promise<BsuidValidation>;
      parse(params: { bsuid: string }): Promise<BsuidParse>;
    };
    username: {
      validate(params: { username: string }): Promise<BusinessUsernameValidation>;
    };
    contact: {
      resolve(params: { bsuid?: string; phone?: string; username?: string }): Promise<ResolvedContact>;
    };
    webhook: {
      normalize(payload: unknown): Promise<NormalizedWebhook>;
    };
  };
}

export function createClient(options: CreateClientOptions = {}): WhatsUsernamesClient {
  const ctx: ClientContext = { baseUrl: options.baseUrl ?? DEFAULT_BASE_URL };

  return {
    usernameLink: (params) => usernameLink(ctx, params),
    phoneLink: (params) => phoneLink(ctx, params),
    validateUsername: (params) => validateUsername(ctx, params),
    validateKey: (params) => validateKey(ctx, params),
    validatePhone: (params) => validatePhone(ctx, params),
    qr: (opts) => qr(ctx, opts),
    openApiSpec: () => openApiSpec(ctx),
    business: {
      bsuid: {
        validate: (params) => bsuidValidate(ctx, params),
        parse: (params) => bsuidParse(ctx, params),
      },
      username: {
        validate: (params) => usernameValidate(ctx, params),
      },
      contact: {
        resolve: (params) => contactResolve(ctx, params),
      },
      webhook: {
        normalize: (payload) => webhookNormalize(ctx, payload),
      },
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/client.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/client.ts src/client.test.ts
git commit -m "feat: add createClient() factory composing all 12 endpoints"
```

---

### Task 8: Public entry point

**Files:**
- Create: `src/index.ts`
- Test: `src/index.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/index.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/index.test.ts`
Expected: FAIL — `Cannot find module './index'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/index.ts
export { createClient, DEFAULT_BASE_URL } from "./client";
export type { CreateClientOptions, WhatsUsernamesClient } from "./client";
export { WhatsUsernamesApiError } from "./errors";
export type {
  ApiErrorDetail,
  BsuidParse,
  BsuidValidation,
  BusinessUsernameValidation,
  ContactType,
  NormalizedEvent,
  NormalizedEventKind,
  NormalizedWebhook,
  PhoneLinkResult,
  QrOptions,
  QrResult,
  ResolvedContact,
  UsernameLinkResult,
  ValidationResult,
} from "./types";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/index.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS, 6 test files, 28 tests total (1 errors + 8 http + 8 consumer + 7 business + 3 client + 1 index).

- [ ] **Step 6: Run lint and type-check**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0, no errors.

- [ ] **Step 7: Run the build**

Run: `npm run build`
Expected: `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, `dist/index.d.cts` created, no errors.

- [ ] **Step 8: Commit**

```bash
git add src/index.ts src/index.test.ts
git commit -m "feat: add public entry point exporting createClient and types"
```

---

### Task 9: README and LICENSE

**Files:**
- Create: `README.md`
- Create: `LICENSE`

- [ ] **Step 1: Write `LICENSE`**

```
MIT License

Copyright (c) 2026 insidedcpulse-spec

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Write `README.md`**

````markdown
# whatsusernames-sdk

[![npm version](https://img.shields.io/npm/v/whatsusernames-sdk.svg)](https://www.npmjs.com/package/whatsusernames-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

TypeScript/JavaScript client for the [WhatsUsernames.link](https://whatsusernames.link) API — a free, keyless REST API for WhatsApp username/phone links, QR codes, and WhatsApp Business Platform BSUID/webhook tools.

## Install

```bash
npm install whatsusernames-sdk
```

## Usage

```ts
import { createClient } from "whatsusernames-sdk";

const wa = createClient();

const { link, shortLink } = await wa.usernameLink({ username: "joao.silva" });
const { link: phoneLink } = await wa.phoneLink({ phone: "351912345678" });

const qr = await wa.qr({ username: "joao.silva", format: "svg" });
// qr.body is a Uint8Array, qr.contentType is "image/svg+xml"
```

### Business Platform / BSUID

```ts
const parsed = await wa.business.bsuid.parse({ bsuid: "US.13491208655302741918" });
// { countryCode: "US", id: "13491208655302741918", isParent: false }

const contact = await wa.business.contact.resolve({ username: "joao.silva" });

const normalized = await wa.business.webhook.normalize(rawCloudApiWebhookPayload);
```

### Error handling

```ts
import { WhatsUsernamesApiError } from "whatsusernames-sdk";

try {
  await wa.usernameLink({ username: "x" });
} catch (err) {
  if (err instanceof WhatsUsernamesApiError) {
    console.error(err.status, err.code, err.message);
  }
}
```

### Self-hosted / local dev

```ts
const wa = createClient({ baseUrl: "http://localhost:3000" });
```

## Full API reference

See [whatsusernames.link/developers](https://whatsusernames.link/developers) and the [OpenAPI 3.1 spec](https://whatsusernames.link/api/v1/openapi.json).

## Development

```bash
npm install
npm test
npm run lint
npm run typecheck
npm run build
```

## License

[MIT](./LICENSE)
````

- [ ] **Step 3: Commit**

```bash
git add README.md LICENSE
git commit -m "docs: add README and MIT license"
```

---

### Task 10: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type-check
        run: npm run typecheck

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

- [ ] **Step 2: Add a CI badge to README**

In `README.md`, add this line above the existing npm-version badge line:

```markdown
[![CI](https://github.com/insidedcpulse-spec/whatsusernames-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/insidedcpulse-spec/whatsusernames-sdk/actions/workflows/ci.yml)
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml README.md
git commit -m "ci: add GitHub Actions workflow (lint, typecheck, test, build)"
```

---

### Task 11: Final verification, push, and npm publish

**Files:** none (verification + publish only)

- [ ] **Step 1: Run the full local verification suite**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: all four succeed with no errors (8 test files, 26 tests, `dist/` populated).

- [ ] **Step 2: Push to GitHub**

```bash
git push -u origin master
```

Expected: push succeeds; if it fails with "Invalid username or token," run `unset GITHUB_TOKEN GH_TOKEN` first, then retry (see `whatsuser-link` project's `feedback_github_push_auth` memory for why).

- [ ] **Step 3: Dry-run the npm package contents**

Run: `npm pack --dry-run`
Expected: file list includes `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, `dist/index.d.cts`, `package.json`, `README.md`, `LICENSE` — and does NOT include `src/`, `docs/`, or any test file.

- [ ] **Step 4: Publish to npm**

The npm automation token is stored at `/root/whatsuser-link-secrets/npm.env` as `NPM_TOKEN`. Publish without ever printing the token to the terminal:

```bash
set -a; source /root/whatsuser-link-secrets/npm.env; set +a
npm config set //registry.npmjs.org/:_authToken "${NPM_TOKEN}" --location=project
npm publish --access public
git checkout -- .npmrc 2>/dev/null || rm -f .npmrc
```

Expected: `+ whatsusernames-sdk@0.1.0` printed, package visible at `https://www.npmjs.com/package/whatsusernames-sdk` within a minute. The final cleanup step removes the temporary project-local `.npmrc` so the token is never committed.

- [ ] **Step 5: Verify the published package installs cleanly**

```bash
mkdir -p /tmp/whatsusernames-sdk-smoke-test && cd /tmp/whatsusernames-sdk-smoke-test
npm init -y >/dev/null
npm install whatsusernames-sdk
node -e "const { createClient } = require('whatsusernames-sdk'); console.log(typeof createClient);"
```

Expected: prints `function`. Then clean up:

```bash
cd /root/whatsusernames-sdk
rm -rf /tmp/whatsusernames-sdk-smoke-test
```
