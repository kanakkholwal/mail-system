import { postJson, requireEnv } from './http.js';
import { formatAddress, recipientEmails, type OutboundMessage, type SendResult, type Transport } from '../types.js';

export interface ResendConfig {
  apiKey: string;
  baseUrl?: string;
}

const NAME = 'resend';

export function resendTransport(config: ResendConfig): Transport {
  const apiKey = requireEnv(NAME, 'apiKey', config.apiKey);
  const baseUrl = config.baseUrl ?? 'https://api.resend.com';

  return {
    name: NAME,
    async send(message: OutboundMessage, signal?: AbortSignal): Promise<SendResult> {
      const { body } = await postJson({
        transport: NAME,
        url: `${baseUrl}/emails`,
        headers: {
          authorization: `Bearer ${apiKey}`,
          // Resend dedupes server-side when this header is present.
          ...(message.idempotencyKey ? { 'idempotency-key': message.idempotencyKey } : {}),
        },
        signal,
        body: {
          from: formatAddress(message.from),
          to: message.to.map(formatAddress),
          ...(message.cc ? { cc: message.cc.map(formatAddress) } : {}),
          ...(message.bcc ? { bcc: message.bcc.map(formatAddress) } : {}),
          ...(message.replyTo ? { reply_to: formatAddress(message.replyTo) } : {}),
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.headers ? { headers: message.headers } : {}),
          ...(message.tags
            ? { tags: Object.entries(message.tags).map(([name, value]) => ({ name, value })) }
            : {}),
          ...(message.attachments
            ? {
                attachments: message.attachments.map((file) => ({
                  filename: file.filename,
                  content: toBase64(file.content),
                  ...(file.contentType ? { content_type: file.contentType } : {}),
                })),
              }
            : {}),
        },
      });

      const id = (body as { id?: string } | undefined)?.id ?? '';
      return {
        transport: NAME,
        messageId: id,
        accepted: recipientEmails(message),
        rejected: [],
        deduped: false,
        raw: body,
      };
    },
  };
}

function toBase64(content: string | Uint8Array): string {
  if (typeof content === 'string') return Buffer.from(content, 'utf8').toString('base64');
  return Buffer.from(content).toString('base64');
}
