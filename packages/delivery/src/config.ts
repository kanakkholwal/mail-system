import { z } from 'zod';
import { ConfigError } from './errors.js';
import { consoleTransport } from './transports/console.js';
import { postmarkTransport } from './transports/postmark.js';
import { resendTransport } from './transports/resend.js';
import { sendgridTransport } from './transports/sendgrid.js';
import { sesTransport } from './transports/ses.js';
import { smtpTransport } from './transports/smtp.js';
import type { Transport } from './types.js';

export const TRANSPORT_KINDS = ['console', 'smtp', 'resend', 'postmark', 'sendgrid', 'ses'] as const;
export type TransportKind = (typeof TRANSPORT_KINDS)[number];

/**
 * Every provider is configured from the same shape, so switching one is a single
 * env change and never a code change.
 */
export const envSchema = z.object({
  MAIL_TRANSPORT: z.enum(TRANSPORT_KINDS).default('console'),
  MAIL_FROM_EMAIL: z.email(),
  MAIL_FROM_NAME: z.string().optional(),
  MAIL_REPLY_TO: z.email().optional(),
  MAIL_OUTPUT_DIR: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_SECURE: z.stringbool().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_POOL: z.stringbool().optional(),

  RESEND_API_KEY: z.string().optional(),
  POSTMARK_SERVER_TOKEN: z.string().optional(),
  POSTMARK_MESSAGE_STREAM: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),

  AWS_REGION: z.string().optional(),
  SES_CONFIGURATION_SET: z.string().optional(),
});

export type MailEnv = z.infer<typeof envSchema>;

export function parseMailEnv(source: Record<string, string | undefined> = process.env): MailEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new ConfigError(`Invalid mail environment. ${detail}`);
  }
  return parsed.data;
}

function need(env: MailEnv, key: keyof MailEnv): string {
  const value = env[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new ConfigError(`MAIL_TRANSPORT="${env.MAIL_TRANSPORT}" requires ${key}`);
  }
  return value;
}

export function transportFromEnv(env: MailEnv): Transport {
  switch (env.MAIL_TRANSPORT) {
    case 'smtp':
      return smtpTransport({
        host: need(env, 'SMTP_HOST'),
        ...(env.SMTP_PORT === undefined ? {} : { port: env.SMTP_PORT }),
        ...(env.SMTP_SECURE === undefined ? {} : { secure: env.SMTP_SECURE }),
        ...(env.SMTP_USER && env.SMTP_PASSWORD
          ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
          : {}),
        ...(env.SMTP_POOL === undefined ? {} : { pool: env.SMTP_POOL }),
      });

    case 'resend':
      return resendTransport({ apiKey: need(env, 'RESEND_API_KEY') });

    case 'postmark':
      return postmarkTransport({
        serverToken: need(env, 'POSTMARK_SERVER_TOKEN'),
        ...(env.POSTMARK_MESSAGE_STREAM ? { messageStream: env.POSTMARK_MESSAGE_STREAM } : {}),
      });

    case 'sendgrid':
      return sendgridTransport({ apiKey: need(env, 'SENDGRID_API_KEY') });

    case 'ses':
      return sesTransport({
        region: need(env, 'AWS_REGION'),
        ...(env.SES_CONFIGURATION_SET ? { configurationSetName: env.SES_CONFIGURATION_SET } : {}),
      });

    case 'console':
      return consoleTransport({
        ...(env.MAIL_OUTPUT_DIR ? { outputDir: env.MAIL_OUTPUT_DIR } : {}),
      });
  }
}
