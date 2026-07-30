import { postJson, requireEnv } from './http.js';
import { recipientEmails, type Address, type OutboundMessage, type SendResult, type Transport } from '../types.js';

export interface SendgridConfig {
  apiKey: string;
  baseUrl?: string;
}

const NAME = 'sendgrid';

const toSg = (address: Address) => ({ email: address.email, ...(address.name ? { name: address.name } : {}) });

export function sendgridTransport(config: SendgridConfig): Transport {
  const apiKey = requireEnv(NAME, 'apiKey', config.apiKey);
  const baseUrl = config.baseUrl ?? 'https://api.sendgrid.com';

  return {
    name: NAME,
    async send(message: OutboundMessage, signal?: AbortSignal): Promise<SendResult> {
      // SendGrid returns 202 with an empty body; the id is only in a header.
      const response = await postJson({
        transport: NAME,
        url: `${baseUrl}/v3/mail/send`,
        headers: { authorization: `Bearer ${apiKey}` },
        signal,
        body: {
          personalizations: [
            {
              to: message.to.map(toSg),
              ...(message.cc ? { cc: message.cc.map(toSg) } : {}),
              ...(message.bcc ? { bcc: message.bcc.map(toSg) } : {}),
            },
          ],
          from: toSg(message.from),
          ...(message.replyTo ? { reply_to: toSg(message.replyTo) } : {}),
          subject: message.subject,
          content: [
            { type: 'text/plain', value: message.text },
            { type: 'text/html', value: message.html },
          ],
          ...(message.headers ? { headers: message.headers } : {}),
          ...(message.tags ? { custom_args: message.tags } : {}),
          ...(message.attachments
            ? {
                attachments: message.attachments.map((file) => ({
                  filename: file.filename,
                  content: toBase64(file.content),
                  type: file.contentType ?? 'application/octet-stream',
                  ...(file.contentId ? { content_id: file.contentId, disposition: 'inline' } : {}),
                })),
              }
            : {}),
        },
      });

      return {
        transport: NAME,
        messageId: '',
        accepted: recipientEmails(message),
        rejected: [],
        deduped: false,
        raw: { status: response.status },
      };
    },
  };
}

function toBase64(content: string | Uint8Array): string {
  if (typeof content === 'string') return Buffer.from(content, 'utf8').toString('base64');
  return Buffer.from(content).toString('base64');
}
