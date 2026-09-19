# spec – Smithy API model (source of truth)

The HTTP API is defined **spec-first** in [Smithy 2.0](https://smithy.io/2.0/) IDL.
From this model we generate:

| Output                          | Plugin                      | Used by                                                                                         |
| ------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| `packages/api-server-sdk`       | `typescript-server-codegen` | `api` (request routing, (de)serialization, validation, typed handlers)                          |
| `packages/openapi/openapi.json` | `openapi`                   | `web` types (openapi-typescript → openapi-fetch/openapi-react-query), Swagger UI at `/api/docs` |

Generated code **is committed**, so nobody needs Java to run or develop the app.
Only people changing the model need to regenerate.

## Layout

```
spec/
├── model/
│   ├── main.smithy           # service, protocol, auth, shared shapes, common errors
│   ├── auth.smithy           # Login, GetCurrentUser
│   ├── companies.smithy
│   ├── guidelines.smithy     # upload (async), versions, retry, activate
│   ├── conversations.smithy  # conversations, messages, assistant guidance shape
│   └── feedback.smithy       # thumbs up/down + corrections
├── smithy-build.json         # Maven deps + plugin configuration
├── scripts/sync-generated.mjs# copies build output into packages/* and fixes package.json
└── Dockerfile                # Smithy CLI image (bundled JRE) used by `pnpm codegen`
```

## Regenerating

From the repo root:

```sh
pnpm codegen            # smithy build in Docker, sync packages/*, regenerate web/src/api/schema.d.ts
pnpm build:generated    # compile the generated packages (dist-cjs / dist-es / dist-types)
```

Or with a locally installed Smithy CLI (`brew install smithy-lang/tap/smithy-cli`, version must match `smithy-build.json`):

```sh
cd spec && smithy build && node scripts/sync-generated.mjs && cd .. && pnpm build:generated
```

## Conventions

- Protocol: `aws.protocols#restJson1`. Auth: `@httpBearerAuth` on the service, `@auth([])` on public operations (`Health`, `Login`). Auth is _enforced_ by the api middleware, the SSDK only exposes the scheme.
- Every error is an `@error` structure with `@httpError`. Errors listed on the **service** apply to all operations; operation-specific errors are listed per operation. Throwing an error that is not associated with the operation makes the SSDK return a generic `InternalFailure` (by design, to avoid leaking details).
- `smithy.framework#ValidationException` is on the service, which turns on automatic input validation from constraint traits (`@length`, `@range`, `@pattern`, `@required`). The error carries `fieldList[{path, message}]`, which the web maps onto form fields.
- Timestamps use the `DateTime` shape (`@timestampFormat("date-time")`); restJson1 would otherwise serialize epoch seconds.
- File upload is a raw `@httpPayload` blob (`UploadGuidelines`) with metadata in `X-Filename`, `X-File-Content-Type`, `X-Expected-Version` headers. Smithy protocols do not model multipart forms.
- List operations use `@paginated` (`cursor` / `nextCursor` / `limit` / `items`).
- Run `smithy validate model` before committing; warnings are treated as things to fix.
