# whatsusernames-sdk

[![CI](https://github.com/insidedcpulse-spec/whatsusernames-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/insidedcpulse-spec/whatsusernames-sdk/actions/workflows/ci.yml)
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
