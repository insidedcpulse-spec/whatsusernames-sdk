# whatsusernames-sdk — design

Data: 2026-07-05

## Contexto

O [WhatsUsernames.link](https://whatsusernames.link) expõe uma API REST pública gratuita (v1) com 12 endpoints: 7 para links/QR/validação de usernames e telefones (consumer WhatsApp), e 5 para a WhatsApp Business Platform / Cloud API (BSUID, usernames de negócio, resolução de contactos, normalização de webhooks). Ver `https://whatsusernames.link/api/v1/openapi.json` (OpenAPI 3.1) e `https://whatsusernames.link/developers`.

Objetivo: publicar um pacote npm (`whatsusernames-sdk`) que embrulhe estes 12 endpoints num cliente TypeScript fino, para que programadores não precisem de escrever `fetch` + parsing de erro à mão.

## Arquitetura

- Zero dependências de runtime — usa `fetch` nativo (Node 18+, browsers, edge runtimes).
- Build dual ESM + CommonJS via `tsup`, para funcionar com `import` e `require()`.
- API de superfície: função factory `createClient(options?)`, não uma classe — evita `new`, mais fácil de tree-shake.

```ts
function createClient(options?: { baseUrl?: string }): WhatsUsernamesClient;
```

`baseUrl` default `https://whatsusernames.link` — permite apontar a um deploy próprio (self-hosted) ou a `localhost` em dev.

## Superfície de métodos (1:1 com os 12 endpoints)

```ts
const wa = createClient();

// Consumer (GET)
wa.usernameLink({ username, key?, text? }): Promise<UsernameLinkResult>
wa.phoneLink({ phone, text? }): Promise<PhoneLinkResult>
wa.validateUsername({ username }): Promise<UsernameValidation>
wa.validateKey({ key }): Promise<KeyValidation>
wa.validatePhone({ phone }): Promise<PhoneValidation>
wa.qr({ username?, phone?, text?, format?, size?, color?, bg? }): Promise<QrResult>
wa.openApiSpec(): Promise<unknown>

// Business Platform (POST)
wa.business.bsuid.validate({ bsuid }): Promise<BsuidValidation>
wa.business.bsuid.parse({ bsuid }): Promise<BsuidParse>
wa.business.username.validate({ username }): Promise<BusinessUsernameValidation>
wa.business.contact.resolve({ bsuid?, phone?, username? }): Promise<ResolvedContact>
wa.business.webhook.normalize(rawPayload: unknown): Promise<NormalizedWebhook>
```

`QrResult` devolve `{ body: Uint8Array, contentType: string }` (PNG ou SVG conforme `format`), não uma URL — o SDK já faz o `fetch` e devolve os bytes prontos a gravar/servir.

## Tipos

Escritos à mão em `src/types.ts`, espelhando os schemas já definidos em `lib/api/openapi.ts` do projeto principal (mesmos nomes: `BsuidValidation`, `BsuidParse`, `ResolvedContact`, `NormalizedWebhook`, etc.). Não há geração automática a partir do spec — é uma escolha deliberada de simplicidade para a v1 (ver secção "Alternativas consideradas").

## Tratamento de erros

Toda resposta HTTP não-2xx lança `WhatsUsernamesApiError`:

```ts
class WhatsUsernamesApiError extends Error {
  code: string;      // ex: "invalid_bsuid", "missing_username"
  status: number;    // status HTTP
  constructor(status: number, code: string, message: string);
}
```

Espelha o shape JSON que a API já devolve: `{ "error": { "code": "...", "message": "..." } }`. Erros de rede (fetch falha) propagam-se como `TypeError` nativo do `fetch`, sem wrapping.

## Testes

Vitest, mockando `global.fetch`. Um ficheiro de teste por grupo de métodos (`username-link.test.ts`, `business-bsuid.test.ts`, etc.), cobrindo por método: URL/query-string ou body JSON construído corretamente, parsing de resposta 200, parsing de erro (código+mensagem lançados como `WhatsUsernamesApiError`).

## CI e publicação

- GitHub Actions: `lint` (ESLint), `typecheck` (`tsc --noEmit`), `test` (Vitest), `build` (`tsup`) — mesmo padrão do repo principal `whatsuser-link`.
- Repo: `insidedcpulse-spec/whatsusernames-sdk`, público, licença MIT (consistente com o projeto principal).
- Publicação no npm registry como `whatsusernames-sdk`, versão inicial `0.1.0`, via `npm publish` manual nesta sessão (token de automação fornecido pelo utilizador).

## Alternativas consideradas

1. **Gerar cliente a partir do OpenAPI spec** (`openapi-typescript-codegen` ou similar): ficaria sempre sincronizado automaticamente com o spec, mas o código gerado é mais verboso/menos idiomático, e adiciona uma dependência de tooling de build extra. Rejeitado para a v1 — a API tem apenas 12 endpoints estáveis, o custo de manter os tipos à mão é baixo.
2. **SDK "completo"** com retry automático, cache, backoff consciente de rate-limit: over-engineering para uma API gratuita e simples (YAGNI). Pode ser adicionado depois se houver pedido real de utilizadores.

## Fora de âmbito (v1)

- Paginação (a API não tem endpoints paginados).
- Autenticação (a API é keyless).
- SDKs para outras linguagens (Python, Go, etc.) — não pedido, avaliar depois se houver procura.
