import cardExpiring from './templates/card-expiring/index.js';
import invoiceIssued from './templates/invoice-issued/index.js';
import magicLink from './templates/magic-link/index.js';
import newDeviceLogin from './templates/new-device-login/index.js';
import otpCode from './templates/otp-code/index.js';
import passwordChanged from './templates/password-changed/index.js';
import paymentFailed from './templates/payment-failed/index.js';
import paymentReceipt from './templates/payment-receipt/index.js';
import referralInvite from './templates/referral-invite/index.js';
import resetPassword from './templates/reset-password/index.js';
import subscriptionCancelled from './templates/subscription-cancelled/index.js';
import trialEnding from './templates/trial-ending/index.js';
import usageLimit from './templates/usage-limit/index.js';
import weeklyDigest from './templates/weekly-digest/index.js';
import winback from './templates/winback/index.js';
import welcomeVerify from './templates/welcome-verify/index.js';
import type { AnyTemplate, Genre, TemplateMeta } from './template.js';

/**
 * Single source of truth. Keys are the stable public API of the service, so a
 * template's `name` can change freely but its key never can.
 */
export const registry = {
  welcome_verify: welcomeVerify,
  reset_password: resetPassword,
  magic_link: magicLink,
  otp_code: otpCode,
  new_device_login: newDeviceLogin,
  password_changed: passwordChanged,
  invoice_issued: invoiceIssued,
  payment_receipt: paymentReceipt,
  payment_failed: paymentFailed,
  subscription_cancelled: subscriptionCancelled,
  card_expiring: cardExpiring,
  trial_ending: trialEnding,
  usage_limit: usageLimit,
  winback: winback,
  referral_invite: referralInvite,
  weekly_digest: weeklyDigest,
} as const;

export type TemplateKey = keyof typeof registry;

export function getTemplate(key: string): AnyTemplate {
  const template = (registry as Record<string, AnyTemplate | undefined>)[key];
  if (!template) {
    throw new Error(`Unknown template "${key}". Available: ${Object.keys(registry).join(', ')}.`);
  }
  return template;
}

export function hasTemplate(key: string): key is TemplateKey {
  return Object.hasOwn(registry, key);
}

export function listTemplates(): TemplateMeta[] {
  return Object.values(registry).map((template) => template.meta);
}

export function listByGenre(): Partial<Record<Genre, TemplateMeta[]>> {
  const grouped: Partial<Record<Genre, TemplateMeta[]>> = {};
  for (const { meta } of Object.values(registry)) {
    (grouped[meta.genre] ??= []).push(meta);
  }
  return grouped;
}
