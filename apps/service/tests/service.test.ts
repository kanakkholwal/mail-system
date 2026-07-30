import { DeliveryError } from '@better-mailer/delivery';
import { getTemplate, listTemplates } from '@better-mailer/emails';
import { describe, expect, it } from 'vitest';
import { EnvError, loadEnv } from '../src/env.js';
import { harness, json, readBody, stubTransport } from './harness.js';

const KEY = 'test-key-0123456789';
const sample = (key: string): unknown => getTemplate(key).sample;

describe('discovery and health', () => {
  it('advertises its routes and transport at the root', async () => {
    const { app } = harness();
    const body = await readBody(await app.request('/'));
    expect(body.transport).toBe('stub');
    expect(body.authenticated).toBe(false);
    expect(body.routes).toContain('POST /v1/send');
  });

  it('reports liveness without touching the transport', async () => {
    const { app } = harness();
    const response = await app.request('/healthz');
    expect(response.status).toBe(200);
    expect((await readBody(response)).status).toBe('ok');
  });

  it('reports readiness with the transport check and template count', async () => {
    const { app } = harness();
    const body = await readBody(await app.request('/readyz'));
    expect(body.status).toBe('ready');
    expect(body.checks.transport).toBe('ok');
    expect(body.templates).toBe(listTemplates().length);
  });

  it('fails readiness while draining so a balancer stops routing first', async () => {
    const { app, deps } = harness();
    deps.lifecycle.beginDrain();
    const response = await app.request('/readyz');
    expect(response.status).toBe(503);
    expect((await readBody(response)).status).toBe('draining');
  });

  it('degrades readiness when the transport cannot be verified', async () => {
    const transport = stubTransport();
    transport.verify = () => Promise.reject(new Error('bad credentials'));
    const { app } = harness({}, transport);
    const response = await app.request('/readyz');
    expect(response.status).toBe(503);
    expect((await readBody(response)).checks.transportError).toMatch(/bad credentials/);
  });

  it('caches the transport probe between readiness checks', async () => {
    const transport = stubTransport();
    let verifies = 0;
    transport.verify = () => {
      verifies += 1;
      return Promise.resolve();
    };
    const { app, clock } = harness({ READY_CACHE_MS: '15000' }, transport);

    await app.request('/readyz');
    await app.request('/readyz');
    expect(verifies).toBe(1);

    clock.advance(15_001);
    await app.request('/readyz');
    expect(verifies).toBe(2);
  });
});

describe('environment', () => {
  it('refuses to boot unauthenticated in production', () => {
    expect(() =>
      loadEnv({ NODE_ENV: 'production', MAIL_FROM_EMAIL: 'a@b.com' }),
    ).toThrow(EnvError);
    expect(() => loadEnv({ NODE_ENV: 'production', MAIL_FROM_EMAIL: 'a@b.com' })).toThrow(/SERVICE_API_KEYS/);
  });

  it('names the offending variable instead of failing opaquely', () => {
    expect(() => loadEnv({ MAIL_FROM_EMAIL: 'not-an-email' })).toThrow(/MAIL_FROM_EMAIL/);
  });

  it('splits comma separated lists and trims them', () => {
    const env = loadEnv({ MAIL_FROM_EMAIL: 'a@b.com', SERVICE_API_KEYS: ' one , two ,,three ' });
    expect(env.SERVICE_API_KEYS).toEqual(['one', 'two', 'three']);
  });
});

describe('authentication', () => {
  it('leaves health probes open and guards /v1', async () => {
    const { app } = harness({ SERVICE_API_KEYS: KEY });
    expect((await app.request('/healthz')).status).toBe(200);

    const denied = await app.request('/v1/templates');
    expect(denied.status).toBe(401);
    expect(denied.headers.get('www-authenticate')).toMatch(/Bearer/);
    expect((await readBody(denied)).error.type).toBe('unauthorized');
  });

  it('rejects a wrong key and accepts the configured one', async () => {
    const { app } = harness({ SERVICE_API_KEYS: `${KEY},second-key-abcdefgh` });
    expect((await app.request('/v1/templates', { headers: { authorization: 'Bearer nope' } })).status).toBe(401);
    expect((await app.request('/v1/templates', { headers: { authorization: `Bearer ${KEY}` } })).status).toBe(200);
    expect(
      (await app.request('/v1/templates', { headers: { authorization: 'Bearer second-key-abcdefgh' } })).status,
    ).toBe(200);
  });
});

describe('rate limiting', () => {
  it('emits limit headers and sheds the request past the ceiling', async () => {
    const { app } = harness({ RATE_LIMIT_MAX: '2', RATE_LIMIT_WINDOW_MS: '60000' });

    const first = await app.request('/v1/templates');
    expect(first.headers.get('ratelimit-limit')).toBe('2');
    expect(first.headers.get('ratelimit-remaining')).toBe('1');

    await app.request('/v1/templates');
    const blocked = await app.request('/v1/templates');
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('60');
    expect((await readBody(blocked)).error.type).toBe('rate_limited');
  });

  it('opens a fresh window once the old one expires', async () => {
    const { app, clock } = harness({ RATE_LIMIT_MAX: '1', RATE_LIMIT_WINDOW_MS: '1000' });
    await app.request('/v1/templates');
    expect((await app.request('/v1/templates')).status).toBe(429);

    clock.advance(1001);
    expect((await app.request('/v1/templates')).status).toBe(200);
  });
});

describe('template catalogue', () => {
  it('lists every registered template', async () => {
    const { app } = harness();
    const body = await readBody(await app.request('/v1/templates'));
    expect(body.count).toBe(listTemplates().length);
    expect(body.templates[0]).toHaveProperty('genre');
  });

  it('filters by genre and by render mode', async () => {
    const { app } = harness();
    const billing = await readBody(await app.request('/v1/templates?genre=billing'));
    expect(billing.count).toBeGreaterThan(0);
    expect(billing.templates.every((meta: { genre: string }) => meta.genre === 'billing')).toBe(true);

    const printable = await readBody(await app.request('/v1/templates?mode=document'));
    const expected = listTemplates().filter((meta) => meta.modes.includes('document')).length;
    expect(printable.count).toBe(expected);
  });

  it('converts every payload schema to JSON Schema', async () => {
    const { app } = harness({ RATE_LIMIT_MAX: '500' });
    const body = await readBody(await app.request('/v1/templates?schema=1'));
    for (const template of body.templates) {
      expect(template.payloadSchema, template.key).toHaveProperty('type', 'object');
      expect(Object.keys(template.payloadSchema.properties ?? {}).length, template.key).toBeGreaterThan(0);
    }
  });

  it('returns the schema, sample and rendered subject for one template', async () => {
    const { app } = harness();
    const body = await readBody(await app.request('/v1/templates/invoice_issued'));
    expect(body.key).toBe('invoice_issued');
    expect(body.subject.length).toBeGreaterThan(0);
    expect(body.sample.previewText).toBeTruthy();
    expect(body.payloadSchema.type).toBe('object');
  });

  it('lists the available keys when one is unknown', async () => {
    const { app } = harness();
    const response = await app.request('/v1/templates/nope');
    expect(response.status).toBe(404);
    const body = await readBody(response);
    expect(body.error.type).toBe('not_found');
    expect(body.error.details.available).toContain('welcome_verify');
  });
});

describe('preview', () => {
  it('serves the sample as HTML with sniffing disabled', async () => {
    const { app } = harness();
    const response = await app.request('/v1/templates/welcome_verify/preview');
    expect(response.headers.get('content-type')).toMatch(/text\/html/);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    const html = await response.text();
    expect(html).toContain('<html');
    expect(html).toContain('data-bm="email"');
  });

  it('renders document mode for a tri-modal template with A4 page rules', async () => {
    const { app } = harness();
    const html = await (await app.request('/v1/templates/invoice_issued/preview?mode=document')).text();
    expect(html).toContain('@page');
    expect(html).toContain('data-bm="document"');
  });

  it('rejects a mode the template does not declare', async () => {
    const { app } = harness();
    const response = await app.request('/v1/templates/otp_code/preview?mode=document');
    expect(response.status).toBe(400);
    expect((await readBody(response)).error.type).toBe('unsupported_mode');
  });

  it('serves the plain text part and the builder design JSON', async () => {
    const { app } = harness();
    const text = await (await app.request('/v1/templates/otp_code/text')).text();
    expect(text.length).toBeGreaterThan(40);
    expect(text).not.toContain('<td');

    const design = await readBody(await app.request('/v1/templates/otp_code/design'));
    expect(design.body.rows.length).toBeGreaterThan(0);
  });
});

describe('render', () => {
  it('returns the subject, both MIME parts and the byte size', async () => {
    const { app } = harness();
    const response = await app.request('/v1/render', json({ template: 'magic_link', payload: sample('magic_link') }));
    expect(response.status).toBe(200);
    const body = await readBody(response);
    expect(body.subject.length).toBeGreaterThan(0);
    expect(body.previewText.length).toBeGreaterThan(0);
    expect(body.html).toContain('<html');
    expect(body.text).toBeTruthy();
    expect(body.bytes).toBe(Buffer.byteLength(body.html, 'utf8'));
    expect(body.design).toBeUndefined();
  });

  it('includes design JSON only when asked', async () => {
    const { app } = harness();
    const body = await readBody(await app.request('/v1/render', json({ template: 'magic_link', payload: sample('magic_link'), design: true })));
    expect(body.design.body.rows.length).toBeGreaterThan(0);
  });

  it('reports payload issues as a 422 with the field paths', async () => {
    const { app } = harness();
    const response = await app.request('/v1/render', json({ template: 'magic_link', payload: { previewText: 'x' } }));
    expect(response.status).toBe(422);
    const body = await readBody(response);
    expect(body.error.type).toBe('validation_error');
    expect(Array.isArray(body.error.details.issues)).toBe(true);
  });

  it('refuses a marketing template with no unsubscribe URL', async () => {
    const { app } = harness();
    const marketing = listTemplates().find((meta) => meta.requiresUnsubscribe);
    const original = getTemplate(marketing?.key ?? '').sample as { legal: Record<string, unknown> };
    const payload = { ...original, legal: { ...original.legal, unsubscribeUrl: undefined } };

    const response = await app.request('/v1/render', json({ template: marketing?.key, payload }));
    expect(response.status).toBe(422);
    expect((await readBody(response)).error.type).toBe('unsubscribe_required');
  });

  it('rejects a non-JSON content type and a malformed body', async () => {
    const { app } = harness();
    expect((await app.request('/v1/render', { method: 'POST', body: 'x' })).status).toBe(415);

    const malformed = await app.request('/v1/render', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ not json',
    });
    expect(malformed.status).toBe(400);
  });
});

describe('send', () => {
  const body = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    template: 'payment_failed',
    payload: sample('payment_failed'),
    to: 'priya@example.com',
    ...extra,
  });

  it('renders, delivers and reports the provider result', async () => {
    const { app, transport } = harness();
    const response = await app.request('/v1/send', json(body()));
    expect(response.status).toBe(202);

    const result = await readBody(response);
    expect(result.messageId).toBe('stub-1');
    expect(result.accepted).toEqual(['priya@example.com']);
    expect(result.requestId).toBeTruthy();

    const message = transport.sent[0];
    expect(message?.to).toEqual([{ email: 'priya@example.com' }]);
    expect(message?.from).toEqual({ email: 'hello@nexonauts.com', name: 'Nexonauts' });
    expect(message?.subject).toBe(result.subject);
    expect(message?.html).toContain('<html');
    expect(message?.text).toBeTruthy();
    expect(message?.tags).toEqual({ template: 'payment_failed' });
  });

  it('accepts named addresses, cc, bcc and a reply-to', async () => {
    const { app, transport } = harness();
    await app.request(
      '/v1/send',
      json(
        body({
          to: [{ email: 'a@example.com', name: 'A' }],
          cc: 'b@example.com',
          bcc: ['c@example.com'],
          replyTo: { email: 'support@nexonauts.com', name: 'Support' },
        }),
      ),
    );

    const message = transport.sent[0];
    expect(message?.to).toEqual([{ email: 'a@example.com', name: 'A' }]);
    expect(message?.cc).toEqual([{ email: 'b@example.com' }]);
    expect(message?.bcc).toEqual([{ email: 'c@example.com' }]);
    expect(message?.replyTo).toEqual({ email: 'support@nexonauts.com', name: 'Support' });
  });

  it('replays an idempotency key instead of delivering twice', async () => {
    const { app, transport } = harness();
    const headers = { 'idempotency-key': 'invoice-4192-attempt-1' };

    const first = await app.request('/v1/send', json(body(), headers));
    const second = await app.request('/v1/send', json(body(), headers));

    expect(first.status).toBe(202);
    expect(second.status).toBe(200);
    expect(second.headers.get('idempotency-replayed')).toBe('true');
    expect(transport.sent).toHaveLength(1);
  });

  it('decodes base64 attachments', async () => {
    const { app, transport } = harness();
    await app.request(
      '/v1/send',
      json(
        body({
          attachments: [{ filename: 'invoice.pdf', contentBase64: Buffer.from('pdf-bytes').toString('base64') }],
        }),
      ),
    );

    const file = transport.sent[0]?.attachments?.[0];
    expect(file?.filename).toBe('invoice.pdf');
    expect(Buffer.from(file?.content ?? '').toString()).toBe('pdf-bytes');
  });

  it('caps the recipient count', async () => {
    const { app } = harness({ SEND_MAX_RECIPIENTS: '2' });
    const response = await app.request(
      '/v1/send',
      json(body({ to: ['a@x.com', 'b@x.com', 'c@x.com'] })),
    );
    expect(response.status).toBe(400);
    expect((await readBody(response)).error.message).toMatch(/at most 2 recipients/);
  });

  it('maps a retryable provider fault to 503 with a retry hint', async () => {
    const transport = stubTransport('resend');
    transport.fail(new DeliveryError('upstream is down', { transport: 'resend', retryable: true }));
    const { app } = harness({}, transport);

    const response = await app.request('/v1/send', json(body()));
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('5');
    const failure = await readBody(response);
    expect(failure.error.type).toBe('delivery_failed');
    expect(failure.error.details.retryable).toBe(true);
  });

  it('maps a permanent provider rejection to 502', async () => {
    const transport = stubTransport('postmark');
    transport.fail(new DeliveryError('inactive recipient', { transport: 'postmark', retryable: false }));
    const { app } = harness({}, transport);

    const response = await app.request('/v1/send', json(body()));
    expect(response.status).toBe(502);
    expect((await readBody(response)).error.details.retryable).toBe(false);
  });

  it('sheds load instead of queueing without bound', async () => {
    const transport = stubTransport();
    const release = transport.hold();
    const { app } = harness({ SEND_CONCURRENCY: '1', SEND_QUEUE_MAX: '0' }, transport);

    const first = app.request('/v1/send', json(body()));
    const second = await app.request('/v1/send', json(body()));

    expect(second.status).toBe(503);
    expect((await readBody(second)).error.type).toBe('overloaded');

    release();
    expect((await first).status).toBe(202);
  });
});

describe('request plumbing', () => {
  it('echoes a sane inbound request id and replaces a junk one', async () => {
    const { app } = harness();
    const echoed = await app.request('/healthz', { headers: { 'x-request-id': 'trace-abc-12345678' } });
    expect(echoed.headers.get('x-request-id')).toBe('trace-abc-12345678');

    const replaced = await app.request('/healthz', { headers: { 'x-request-id': 'short' } });
    expect(replaced.headers.get('x-request-id')).not.toBe('short');
    expect(replaced.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects a body over the configured ceiling', async () => {
    const { app } = harness({ MAX_BODY_BYTES: '256' });
    const response = await app.request('/v1/render', json({ template: 'magic_link', payload: sample('magic_link') }));
    expect(response.status).toBe(413);
    expect((await readBody(response)).error.type).toBe('payload_too_large');
  });

  it('returns a structured 404 for an unknown route', async () => {
    const { app } = harness();
    const response = await app.request('/v2/send');
    expect(response.status).toBe(404);
    expect((await readBody(response)).error.type).toBe('not_found');
  });

  it('omits CORS headers unless origins are configured', async () => {
    const closed = harness();
    const withoutCors = await closed.app.request('/v1/templates', { headers: { origin: 'https://evil.example' } });
    expect(withoutCors.headers.get('access-control-allow-origin')).toBeNull();

    const open = harness({ CORS_ORIGINS: 'https://studio.nexonauts.com' });
    const allowed = await open.app.request('/v1/templates', {
      headers: { origin: 'https://studio.nexonauts.com' },
    });
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://studio.nexonauts.com');
  });
});
