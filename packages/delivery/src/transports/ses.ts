import { DeliveryError, isRetryableStatus, isTransientNetworkError } from '../errors.js';
import { formatAddress, recipientEmails, type OutboundMessage, type SendResult, type Transport } from '../types.js';

export interface SesConfig {
  region: string;
  /** Omit to let the SDK use the ambient credential chain (IAM role, env, SSO). */
  credentials?: { accessKeyId: string; secretAccessKey: string; sessionToken?: string };
  /** Configuration set for open and click tracking plus event publishing. */
  configurationSetName?: string;
}

const NAME = 'ses';
const SES_MODULE = '@aws-sdk/client-sesv2';

/**
 * SES needs SigV4, which is not worth hand-rolling, so this is the one transport
 * that requires an SDK. It is a lazy optional import.
 */
export function sesTransport(config: SesConfig): Transport {
  let client: { send(command: unknown): Promise<unknown> } | undefined;
  let CommandCtor: new (input: unknown) => unknown;

  async function connect() {
    if (client) return client;
    try {
      // Non-literal specifier so the optional peer is not a compile-time import.
      const sdk = (await import(SES_MODULE)) as unknown as {
        SESv2Client: new (options: unknown) => { send(command: unknown): Promise<unknown> };
        SendEmailCommand: new (input: unknown) => unknown;
      };
      CommandCtor = sdk.SendEmailCommand;
      client = new sdk.SESv2Client({
        region: config.region,
        ...(config.credentials ? { credentials: config.credentials } : {}),
      });
      return client;
    } catch (error) {
      throw new DeliveryError('ses: @aws-sdk/client-sesv2 is not installed.', {
        transport: NAME,
        retryable: false,
        cause: error,
      });
    }
  }

  return {
    name: NAME,
    async send(message: OutboundMessage): Promise<SendResult> {
      const sesClient = await connect();
      const command = new CommandCtor({
        FromEmailAddress: formatAddress(message.from),
        Destination: {
          ToAddresses: message.to.map(formatAddress),
          ...(message.cc ? { CcAddresses: message.cc.map(formatAddress) } : {}),
          ...(message.bcc ? { BccAddresses: message.bcc.map(formatAddress) } : {}),
        },
        ...(message.replyTo ? { ReplyToAddresses: [formatAddress(message.replyTo)] } : {}),
        ...(config.configurationSetName ? { ConfigurationSetName: config.configurationSetName } : {}),
        ...(message.tags
          ? {
              EmailTags: Object.entries(message.tags).map(([Name, Value]) => ({ Name, Value })),
            }
          : {}),
        Content: {
          Simple: {
            Subject: { Data: message.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: message.html, Charset: 'UTF-8' },
              Text: { Data: message.text, Charset: 'UTF-8' },
            },
          },
        },
      });

      try {
        const response = (await sesClient.send(command)) as {
          MessageId?: string;
          $metadata?: { httpStatusCode?: number };
        };
        return {
          transport: NAME,
          messageId: response.MessageId ?? '',
          accepted: recipientEmails(message),
          rejected: [],
          deduped: false,
          raw: response,
        };
      } catch (error) {
        const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
        const throttled = (error as { name?: string }).name === 'TooManyRequestsException';
        throw new DeliveryError(`ses: ${(error as Error).message}`, {
          transport: NAME,
          retryable:
            throttled || isTransientNetworkError(error) || (status !== undefined && isRetryableStatus(status)),
          ...(status === undefined ? {} : { statusCode: status }),
          cause: error,
        });
      }
    },
  };
}
