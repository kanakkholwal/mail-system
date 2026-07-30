import invoiceIssued from './templates/invoice-issued/index.js';
import magicLink from './templates/magic-link/index.js';
import newDeviceLogin from './templates/new-device-login/index.js';
import otpCode from './templates/otp-code/index.js';
import passwordChanged from './templates/password-changed/index.js';
import resetPassword from './templates/reset-password/index.js';
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
