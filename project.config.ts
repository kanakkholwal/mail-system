import { z } from "zod";

/**
 * -----------------------------------------------------------------------------
 * Environment Configuration
 * -----------------------------------------------------------------------------
 * We use Zod to enforce strict validation of environment variables.
 * This ensures the application fails fast if required config is missing.
 */

const envSchema = z.object({
  // Security
  SERVER_IDENTITY: z.string().min(1, "SERVER_IDENTITY is required for API security"),

  // SMTP Configuration
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required").optional().default("smtp-relay.sendinblue.com"),
  MAIL_EMAIL: z.string().email("MAIL_EMAIL must be a valid email address").default("noreply@nexonauts.com"),
  MAIL_PASSWORD: z.string().min(1, "MAIL_PASSWORD is required").default(""),

  // Optional: Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Parse process.env - will throw a detailed error if validation fails
const env = envSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> { }
  }
}


export const SMTP_SETTINGS = {
  host: env.SMTP_HOST || "smtp-relay.sendinblue.com", // "smtp.gmail.com", //replace with your email provider,
  port: 587, // Standard submission port. Use 465 for SSL/TLS if needed.
  // secure: false, // true for 465, false for other ports
  auth: {
    user: env.MAIL_EMAIL,
    pass: env.MAIL_PASSWORD,
  },
  // Recommended for robust delivery:
  // tls: {
  //   ciphers: "SSLv3",
  //   rejectUnauthorized: env.NODE_ENV === "production",
  // },
} as const;

/**
 * -----------------------------------------------------------------------------
 * UNIFIED PROJECT CONFIG
 * -----------------------------------------------------------------------------
 * 
 */
export const config = {
  app: {
    name: "Nexonauts",
    org: "Nexonauts",
    domain: "nexonauts.com",
  },
  email: {
    sender: "Nexonauts <noreply@nexonauts.com>",
    address: "noreply@nexonauts.com",
    smtp: SMTP_SETTINGS,
  },
  security: {
    identityKey: env.SERVER_IDENTITY,
  },
} as const;