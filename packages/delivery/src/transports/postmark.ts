import { postJson, requireEnv } from './http.js';
import { formatAddressList, recipientEmails, type OutboundMessage, type SendResult, type Transport } from '../types.js';

export interface PostmarkConfig {
  serverToken: string;
  /** Postmark stream. Transactional and broadcast mail must not share one. */
  messageStream?: string;
  baseUrl?: string;
}

const NAME = 'postmark';

export function postmarkTransport(config: PostmarkConfig): Transport {
  const token = requireEnv(NAME, 'serverToken', config.serverToken);
  const baseUrl = config.baseUrl ?? 'https://api.postmarkapp.com';
  const stream = config.messageStream ?? 'outbound';

  return {
    name: NAME,
    async send(message: OutboundMessage, signal?: AbortSignal): Promise<SendResult> {
      const { body } = await postJson({
        transport: NAME,
        url: `${baseUrl}/email`,
        headers: { 'X-Postmark-Server-Token': token },
        signal,
        body: {
          From: formatAddressList([message.from]),
          To: formatAddressList(message.to),
          ...(message.cc ? { Cc: formatAddressList(message.cc) } : {}),
          ...(message.bcc ? { Bcc: formatAddressList(message.bcc) } : {}),
          ...(message.replyTo ? { ReplyTo: formatAddressList([message.replyTo]) } : {}),
          Subject: message.subject,
          HtmlBody: message.html,
          TextBody: message.text,
          MessageStream: stream,
          ...(message.tags ? { Metadata: message.tags } : {}),
          ...(message.headers
            ? { Headers: Object.entries(message.headers).map(([Name, Value]) => ({ Name, Value })) }
            : {}),
          ...(message.attachments
            ? {
                Attachments: message.attachments.map((file) => ({
                  Name: file.filename,
                  Content: toBase64(file.content),
                  ContentType: file.contentType ?? 'application/octet-stream',
                  ...(file.contentId ? { ContentID: file.contentId } : {}),
                })),
              }
            : {}),
        },
      });

      const payload = body as { MessageID?: string; To?: string } | undefined;
      return {
        transport: NAME,
        messageId: payload?.MessageID ?? '',
        accepted: recipientEmails(message),
        rejected: [],
        deduped: false,
        raw: body,
      };
    },

    async verify(): Promise<void> {
      await postJson({
        transport: NAME,
        url: `${baseUrl}/email`,
        headers: { 'X-Postmark-Server-Token': token },
        body: {},
      }).catch((error: unknown) => {
        // A 422 proves the token authenticated and only the payload was empty.
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 422) return;
        throw error;
      });
    },
  };
}

function toBase64(content: string | Uint8Array): string {
  if (typeof content === 'string') return Buffer.from(content, 'utf8').toString('base64');
  return Buffer.from(content).toString('base64');
}
