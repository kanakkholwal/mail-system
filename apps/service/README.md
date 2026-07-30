# @better-mailer/service

HTTP service over [`@better-mailer/emails`](../../packages/emails) and
[`@better-mailer/delivery`](../../packages/delivery). It renders an Elements template, validates the
payload against that template's own schema, and hands the result to whichever provider the
environment selects.

Hono is the framework so the same handler runs on Node, Bun, Workers and Vercel. Nothing in
`src/app.ts` touches a Node API; only `src/index.ts` does.

## Run it

```bash
cp .env.example .env      # from the repo root, MAIL_FROM_EMAIL is the only required value
bun run build:packages    # the service consumes the packages through their exports map
bun run --filter '@better-mailer/service' dev
```

The default transport is `console`, which writes each message to `MAIL_OUTPUT_DIR` instead of
sending it. Nothing else needs to be running.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/healthz` | Liveness. Never touches the provider. |
| GET | `/readyz` | Readiness. Verifies transport credentials, cached for `READY_CACHE_MS`. |
| GET | `/v1/templates` | Catalogue. `?genre=`, `?mode=`, `?schema=1`. |
| GET | `/v1/templates/:key` | Metadata, JSON Schema for the payload, and the sample. |
| GET | `/v1/templates/:key/preview` | Rendered HTML of the sample. `?mode=email\|web\|document`. |
| GET | `/v1/templates/:key/text` | The `text/plain` MIME part. |
| GET | `/v1/templates/:key/design` | Design JSON, ready to open in the Unlayer builder. |
| POST | `/v1/render` | Render a payload without sending. |
| POST | `/v1/send` | Render and deliver. |

Everything under `/v1` sits behind the bearer key, the rate limiter and the body ceiling. The health
probes do not, so a load balancer can reach them without a credential.

### Send

```bash
curl -X POST http://localhost:30001/v1/send \
  -H "Authorization: Bearer $SERVICE_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: invoice-4192-attempt-1' \
  -d '{
    "template": "invoice_issued",
    "to": "priya@example.com",
    "payload": { "...": "see GET /v1/templates/invoice_issued" }
  }'
```

`to`, `cc`, `bcc`, `from` and `replyTo` each accept a bare address string or `{ email, name }`, and
the list forms accept a single value. `from` and `replyTo` fall back to `MAIL_FROM_*` and
`MAIL_REPLY_TO`.

A successful send returns **202**, because the provider has accepted the message and delivery is
still ahead of it. A replayed idempotency key returns **200** with the original result and an
`Idempotency-Replayed: true` header.

`/v1/send` takes no `mode`. Web and document renders carry a page shell and print rules that do not
belong in a MIME body, so a send is always email mode.

## Errors

Every failure is the same envelope, with the request id so a caller can quote it in a bug report.

```json
{ "error": { "type": "validation_error", "message": "...", "details": {} }, "requestId": "..." }
```

| Status | `type` | Cause |
| --- | --- | --- |
| 400 | `bad_request` | Malformed body, or too many recipients. |
| 400 | `unsupported_mode` | The template does not declare that render mode. |
| 401 | `unauthorized` | Missing or unrecognised bearer key. |
| 404 | `not_found` | Unknown template. `details.available` lists the valid keys. |
| 413 | `payload_too_large` | Body over `MAX_BODY_BYTES`. |
| 415 | `bad_request` | Not `application/json`. |
| 422 | `validation_error` | Payload failed the template's schema. `details.issues` has the paths. |
| 422 | `unsubscribe_required` | A marketing-class template with no `legal.unsubscribeUrl`. |
| 429 | `rate_limited` | Over `RATE_LIMIT_MAX`. `Retry-After` is set. |
| 502 | `delivery_failed` | The provider rejected it permanently. Do not retry. |
| 503 | `delivery_failed` | Provider fault or timeout. `Retry-After` is set. |
| 503 | `overloaded` | `SEND_QUEUE_MAX` waiters already queued. |

The 502/503 split is the point of the `retryable` classification in `@better-mailer/delivery`: a
caller can act on the status without parsing a provider's error prose.

## Operational behaviour

**Idempotency.** `Idempotency-Key` is claimed before the provider is called and released if the send
fails permanently, so a corrected payload can reuse the key rather than being stuck. A concurrent
request holding the same key waits for the first to settle instead of double sending.

**Load shedding.** `SEND_CONCURRENCY` caps simultaneous provider calls and `SEND_QUEUE_MAX` bounds
the waiting line. Past that the service returns 503 immediately rather than accumulating sockets
that will all time out.

**Rate limiting.** Fixed window, keyed on the API key when one is present and otherwise on the
client address. In-process by default; `RateLimitStore` in `src/rate-limit.ts` is the seam for a
Redis implementation, and nothing else changes.

**Draining.** On `SIGTERM` readiness starts failing before the socket closes, so a balancer stops
routing while in-flight sends finish. If they exceed `SHUTDOWN_GRACE_MS` the process exits non-zero
and logs how much work it abandoned.

**Logs.** One JSON object per line, every line carrying `requestId`. Fields whose names look like
credentials are redacted. Health probes log at `debug` so probe traffic does not bury real requests.

**Auth.** Keys are compared as SHA-256 digests through `timingSafeEqual`. With `NODE_ENV=production`
the service refuses to boot without `SERVICE_API_KEYS`, because an open `/v1/send` is an open relay.

## Tests

```bash
bun run --filter '@better-mailer/service' test
```

49 tests. Route behaviour goes through `app.request`, and the runtime pieces (drain, semaphore, rate
limit window, log redaction) are tested directly.

Tests deliberately resolve the workspace packages through their exports map rather than through
source aliases. An earlier source alias meant dev and production resolved different files, and a
render bug reproduced only in production.
