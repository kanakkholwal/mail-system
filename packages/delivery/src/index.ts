export { ConfigError, DeliveryError, isRetryableSmtpCode, isRetryableStatus, isTransientNetworkError } from './errors.js';
export { MemoryIdempotencyStore, type IdempotencyStore } from './idempotency.js';
export { createMailer, Mailer, type LogEvent, type Logger, type MailerOptions } from './mailer.js';
export { backoffDelay, defaultRetryPolicy, withRetry, type RetryContext, type RetryOptions, type RetryPolicy } from './retry.js';
export {
  envSchema,
  parseMailEnv,
  transportFromEnv,
  TRANSPORT_KINDS,
  type MailEnv,
  type TransportKind,
} from './config.js';
export { consoleTransport, type ConsoleConfig } from './transports/console.js';
export { postmarkTransport, type PostmarkConfig } from './transports/postmark.js';
export { resendTransport, type ResendConfig } from './transports/resend.js';
export { sendgridTransport, type SendgridConfig } from './transports/sendgrid.js';
export { sesTransport, type SesConfig } from './transports/ses.js';
export { smtpTransport, type SmtpConfig } from './transports/smtp.js';
export {
  formatAddress,
  formatAddressList,
  recipientEmails,
  type Address,
  type Attachment,
  type OutboundMessage,
  type SendResult,
  type Transport,
} from './types.js';
