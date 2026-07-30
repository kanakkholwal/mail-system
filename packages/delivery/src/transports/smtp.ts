import { DeliveryError, isRetryableSmtpCode, isTransientNetworkError } from '../errors.js';
import { formatAddress, formatAddressList, type OutboundMessage, type SendResult, type Transport } from '../types.js';

export interface SmtpConfig {
  host: string;
  port?: number;
  /** True for implicit TLS on 465. Port 587 upgrades with STARTTLS instead. */
  secure?: boolean;
  auth?: { user: string; pass: string };
  /** Reuses one connection across sends, which matters for bulk throughput. */
  pool?: boolean;
  maxConnections?: number;
  requireTls?: boolean;
}

const NAME = 'smtp';

type NodemailerTransporter = {
  sendMail(options: Record<string, unknown>): Promise<{
    messageId?: string;
    accepted?: unknown[];
    rejected?: unknown[];
  }>;
  verify(): Promise<unknown>;
  close?(): void;
};

/**
 * Nodemailer is a lazy import so the package stays installable, and edge-safe,
 * for anyone using only the REST providers.
 */
export function smtpTransport(config: SmtpConfig): Transport & { close(): Promise<void> } {
  const port = config.port ?? 587;
  let transporter: NodemailerTransporter | undefined;

  async function connect(): Promise<NodemailerTransporter> {
    if (transporter) return transporter;
    let nodemailer: { createTransport(options: Record<string, unknown>): NodemailerTransporter };
    try {
      nodemailer = (await import('nodemailer')) as unknown as typeof nodemailer;
    } catch (error) {
      throw new DeliveryError('smtp: nodemailer is not installed. Run "bun add nodemailer".', {
        transport: NAME,
        retryable: false,
        cause: error,
      });
    }
    transporter = nodemailer.createTransport({
      host: config.host,
      port,
      secure: config.secure ?? port === 465,
      requireTLS: config.requireTls ?? port === 587,
      ...(config.auth ? { auth: config.auth } : {}),
      ...(config.pool ? { pool: true, maxConnections: config.maxConnections ?? 5 } : {}),
    });
    return transporter;
  }

  return {
    name: NAME,

    async send(message: OutboundMessage): Promise<SendResult> {
      const client = await connect();
      try {
        const info = await client.sendMail({
          from: formatAddress(message.from),
          to: formatAddressList(message.to),
          ...(message.cc ? { cc: formatAddressList(message.cc) } : {}),
          ...(message.bcc ? { bcc: formatAddressList(message.bcc) } : {}),
          ...(message.replyTo ? { replyTo: formatAddress(message.replyTo) } : {}),
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.headers ? { headers: message.headers } : {}),
          ...(message.attachments
            ? {
                attachments: message.attachments.map((file) => ({
                  filename: file.filename,
                  content: file.content,
                  ...(file.contentType ? { contentType: file.contentType } : {}),
                  ...(file.contentId ? { cid: file.contentId } : {}),
                })),
              }
            : {}),
        });

        return {
          transport: NAME,
          messageId: info.messageId ?? '',
          accepted: (info.accepted ?? []).map(String),
          rejected: (info.rejected ?? []).map(String),
          deduped: false,
          raw: info,
        };
      } catch (error) {
        const code = (error as { responseCode?: number }).responseCode;
        throw new DeliveryError(`smtp: ${(error as Error).message}`, {
          transport: NAME,
          retryable: isRetryableSmtpCode(code) || isTransientNetworkError(error),
          ...(code === undefined ? {} : { statusCode: code }),
          cause: error,
        });
      }
    },

    async verify(): Promise<void> {
      const client = await connect();
      try {
        await client.verify();
      } catch (error) {
        throw new DeliveryError(`smtp: verify failed. ${(error as Error).message}`, {
          transport: NAME,
          retryable: isTransientNetworkError(error),
          cause: error,
        });
      }
    },

    async close(): Promise<void> {
      transporter?.close?.();
      transporter = undefined;
    },
  };
}
