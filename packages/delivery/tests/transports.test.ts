import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeliveryError, isRetryableSmtpCode, isRetryableStatus } from '../src/errors.js';
import { backoffDelay, defaultRetryPolicy } from '../src/retry.js';
import { parseMailEnv, transportFromEnv } from '../src/config.js';
import { resendTransport } from '../src/transports/resend.js';
import { postmarkTransport } from '../src/transports/postmark.js';
import { formatAddress } from '../src/types.js';

const base = {
  from: { email: 'noreply@nexonauts.com', name: 'Nexonauts' },
  to: [{ email: 'priya@example.com', name: 'Priya' }],
  subject: 'Hello',
  html: '<p>hi</p>',
  text: 'hi',
};

afterEach(() => vi.unstubAllGlobals());

function stubFetch(status: number, body: unknown) {
  // Params are declared so mock.calls is typed and needs no cast at each use.
  const spy = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
    new Response(JSON.stringify(body), { status }),
  );
  vi.stubGlobal('fetch', spy);
  return spy;
}

type FetchSpy = ReturnType<typeof stubFetch>;

function sentBody(spy: FetchSpy): Record<string, unknown> {
  return JSON.parse(String(spy.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
}

function sentHeaders(spy: FetchSpy): Record<string, string> {
  return (spy.mock.calls[0]?.[1]?.headers ?? {}) as Record<string, string>;
}

describe('error classification', () => {
  it.each([
    [429, true],
    [500, true],
    [503, true],
    [408, true],
    [400, false],
    [401, false],
    [403, false],
    [422, false],
  ])('status %i retryable=%s', (status, expected) => {
    expect(isRetryableStatus(status)).toBe(expected);
  });

  it.each([
    [421, true],
    [450, true],
    [452, true],
    [550, false],
    [553, false],
  ])('smtp code %i retryable=%s', (code, expected) => {
    expect(isRetryableSmtpCode(code)).toBe(expected);
  });
});

describe('backoff', () => {
  it('grows exponentially and respects the ceiling', () => {
    const policy = { ...defaultRetryPolicy, jitter: false };
    expect(backoffDelay(1, policy)).toBe(250);
    expect(backoffDelay(2, policy)).toBe(500);
    expect(backoffDelay(3, policy)).toBe(1000);
    expect(backoffDelay(20, policy)).toBe(policy.maxDelayMs);
  });

  it('never exceeds the exponential when jittered', () => {
    const policy = { ...defaultRetryPolicy, jitter: true };
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const delay = backoffDelay(attempt, policy, () => 1);
      expect(delay).toBeLessThanOrEqual(policy.maxDelayMs);
    }
  });
});

describe('address formatting', () => {
  it('leaves a bare address alone', () => {
    expect(formatAddress({ email: 'a@b.com' })).toBe('a@b.com');
  });

  it('quotes a display name and escapes embedded quotes', () => {
    expect(formatAddress({ email: 'a@b.com', name: 'Doe, Jane' })).toBe('"Doe, Jane" <a@b.com>');
    expect(formatAddress({ email: 'a@b.com', name: 'Ja"ne' })).toBe('"Ja\\"ne" <a@b.com>');
  });
});

describe('resend transport', () => {
  it('posts the message and returns the provider id', async () => {
    const spy = stubFetch(200, { id: 'r-123' });
    const result = await resendTransport({ apiKey: 'key' }).send(base);
    expect(result.messageId).toBe('r-123');
    const body = sentBody(spy);
    expect(body.to).toEqual(['"Priya" <priya@example.com>']);
    expect(body.text).toBe('hi');
  });

  it('forwards the idempotency key as a header', async () => {
    const spy = stubFetch(200, { id: 'r-1' });
    await resendTransport({ apiKey: 'key' }).send({ ...base, idempotencyKey: 'abc' });
    expect(sentHeaders(spy)['idempotency-key']).toBe('abc');
  });

  it('marks a 429 retryable and a 422 permanent', async () => {
    stubFetch(429, { message: 'slow down' });
    await expect(resendTransport({ apiKey: 'k' }).send(base)).rejects.toMatchObject({ retryable: true });

    stubFetch(422, { message: 'bad address' });
    await expect(resendTransport({ apiKey: 'k' }).send(base)).rejects.toMatchObject({ retryable: false });
  });

  it('rejects a missing api key without a network call', () => {
    expect(() => resendTransport({ apiKey: '' })).toThrow(DeliveryError);
  });
});

describe('postmark transport', () => {
  it('sends on the configured stream', async () => {
    const spy = stubFetch(200, { MessageID: 'pm-9' });
    const result = await postmarkTransport({ serverToken: 't', messageStream: 'broadcast' }).send(base);
    expect(result.messageId).toBe('pm-9');
    expect(sentBody(spy).MessageStream).toBe('broadcast');
  });

  it('defaults to the outbound stream', async () => {
    const spy = stubFetch(200, { MessageID: 'pm-1' });
    await postmarkTransport({ serverToken: 't' }).send(base);
    expect(sentBody(spy).MessageStream).toBe('outbound');
  });
});

describe('env configuration', () => {
  it('defaults to the console transport', () => {
    const env = parseMailEnv({ MAIL_FROM_EMAIL: 'a@b.com' });
    expect(env.MAIL_TRANSPORT).toBe('console');
    expect(transportFromEnv(env).name).toBe('console');
  });

  it('selects a provider from one variable', () => {
    const env = parseMailEnv({
      MAIL_FROM_EMAIL: 'a@b.com',
      MAIL_TRANSPORT: 'resend',
      RESEND_API_KEY: 'key',
    });
    expect(transportFromEnv(env).name).toBe('resend');
  });

  it('names the missing variable when a provider is under-configured', () => {
    const env = parseMailEnv({ MAIL_FROM_EMAIL: 'a@b.com', MAIL_TRANSPORT: 'resend' });
    expect(() => transportFromEnv(env)).toThrow(/RESEND_API_KEY/);
  });

  it('rejects an invalid from address', () => {
    expect(() => parseMailEnv({ MAIL_FROM_EMAIL: 'not-an-email' })).toThrow(/MAIL_FROM_EMAIL/);
  });

  it('coerces the smtp port and boolean flags', () => {
    const env = parseMailEnv({
      MAIL_FROM_EMAIL: 'a@b.com',
      MAIL_TRANSPORT: 'smtp',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_SECURE: 'true',
    });
    expect(env.SMTP_PORT).toBe(465);
    expect(env.SMTP_SECURE).toBe(true);
  });
});
