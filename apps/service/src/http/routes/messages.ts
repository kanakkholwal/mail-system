import type { Address, Attachment, OutboundMessage } from '@better-mailer/delivery';
import { getTemplate, hasTemplate, listTemplates, renderTemplate } from '@better-mailer/emails';
import { Hono } from 'hono';
import { readJson } from '../body.js';
import type { AppEnv, Deps } from '../context.js';
import { HttpError } from '../errors.js';
import { renderRequestSchema, sendRequestSchema, type RequestAddress, type SendRequest } from '../schema.js';

function resolve(key: string) {
  if (!hasTemplate(key)) {
    throw new HttpError(404, 'not_found', `Unknown template "${key}".`, {
      available: listTemplates().map((meta) => meta.key),
    });
  }
  return getTemplate(key);
}

function toAddress(input: RequestAddress): Address {
  return 'name' in input && input.name ? { email: input.email, name: input.name } : { email: input.email };
}

function decode(attachments: NonNullable<SendRequest['attachments']>): Attachment[] {
  return attachments.map((file) => ({
    filename: file.filename,
    content: new Uint8Array(Buffer.from(file.contentBase64, 'base64')),
    ...(file.contentType ? { contentType: file.contentType } : {}),
    ...(file.contentId ? { contentId: file.contentId } : {}),
  }));
}

export function messageRoutes(deps: Deps): Hono<AppEnv> {
  const routes = new Hono<AppEnv>();

  routes.post('/render', async (c) => {
    const body = await readJson(c, renderRequestSchema);
    const template = resolve(body.template);
    const rendered = renderTemplate(template, body.payload, {
      mode: body.mode,
      ...(body.subject ? { subject: body.subject } : {}),
    });

    return c.json({
      template: rendered.key,
      mode: rendered.mode,
      subject: rendered.subject,
      previewText: rendered.previewText,
      html: rendered.html,
      text: rendered.text,
      bytes: Buffer.byteLength(rendered.html, 'utf8'),
      ...(body.design ? { design: rendered.design } : {}),
    });
  });

  routes.post('/send', async (c) => {
    const body = await readJson(c, sendRequestSchema);
    const template = resolve(body.template);

    const to = body.to.map(toAddress);
    const cc = body.cc?.map(toAddress);
    const bcc = body.bcc?.map(toAddress);
    const recipients = to.length + (cc?.length ?? 0) + (bcc?.length ?? 0);
    if (recipients > deps.env.SEND_MAX_RECIPIENTS) {
      throw new HttpError(
        400,
        'bad_request',
        `A single send accepts at most ${deps.env.SEND_MAX_RECIPIENTS} recipients; received ${recipients}.`,
      );
    }

    const rendered = renderTemplate(template, body.payload, {
      mode: 'email',
      ...(body.subject ? { subject: body.subject } : {}),
    });

    const from = body.from
      ? toAddress(body.from)
      : {
          email: deps.env.MAIL_FROM_EMAIL,
          ...(deps.env.MAIL_FROM_NAME ? { name: deps.env.MAIL_FROM_NAME } : {}),
        };
    const replyTo = body.replyTo
      ? toAddress(body.replyTo)
      : deps.env.MAIL_REPLY_TO
        ? { email: deps.env.MAIL_REPLY_TO }
        : undefined;

    // Header wins over the body field: it is the transport-level contract a proxy
    // or queue can set without rewriting the payload.
    const idempotencyKey = c.req.header('idempotency-key') ?? body.idempotencyKey;

    const message: OutboundMessage = {
      from,
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      ...(cc ? { cc } : {}),
      ...(bcc ? { bcc } : {}),
      ...(replyTo ? { replyTo } : {}),
      ...(body.headers ? { headers: body.headers } : {}),
      ...(body.tags ? { tags: { template: rendered.key, ...body.tags } } : { tags: { template: rendered.key } }),
      ...(body.attachments ? { attachments: decode(body.attachments) } : {}),
      ...(idempotencyKey ? { idempotencyKey } : {}),
    };

    const release = await deps.sends.acquire();
    try {
      const result = await deps.mailer.send(message);
      if (result.deduped) c.header('idempotency-replayed', 'true');
      return c.json(
        {
          template: rendered.key,
          transport: result.transport,
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected,
          deduped: result.deduped,
          subject: rendered.subject,
          requestId: c.get('requestId'),
        },
        result.deduped ? 200 : 202,
      );
    } finally {
      release();
    }
  });

  return routes;
}
