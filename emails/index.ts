/**
 * mailer-easy - Type-safe email templates
 * 
 * A comprehensive email templating library built with React Email,
 * Zod validation, and Nodemailer integration.
 */

// ============================================================================
// Core Email Rendering & Registry
// ============================================================================

/**
 * Render email templates to HTML strings
 */
export { getEmailTemplate, renderEmail } from './renderer';

/**
 * Template registry with all available email templates
 */
export { registry } from './registry';

/**
 * Email sending helper with Nodemailer integration
 */
export { handleEmailFire } from './helper';


// ============================================================================
// Type Exports
// ============================================================================

/**
 * Template keys for type-safe template selection
 */
export type { TemplateKey } from './registry';

/**
 * Email payload types for sending emails
 */
export type { MailerPayload } from './schema';


// ============================================================================
// Design System (Kit)
// ============================================================================

/**
 * Design tokens and theme configuration
 */
export { tokens } from './kit/tokens';

/**
 * Tailwind CSS configuration for emails
 */
export { emailTailwindConfig } from './kit/tailwind';

/**
 * Type definitions for email components
 */
export type * from './kit/types';


// ============================================================================
// Email Components
// ============================================================================

/**
 * Button component for CTAs and actions
 */
export { Button } from './kit/components/button';

/**
 * Footer component with branding and links
 */
export { Footer } from './kit/components/footer';

/**
 * Header component with logo and branding
 */
export { Header } from './kit/components/header';

/**
 * Base layout wrapper for email templates
 */
export { Layout } from './kit/components/layout';

/**
 * Typography components for consistent text styling
 */
export { BodyText, H1, H2, SubText } from './kit/components/typography';


// ============================================================================
// Template Schemas & Types
// ============================================================================

/**
 * Welcome/Verification Email
 */
export { welcomeEmailSchema } from './templates/welcome-verify/schema';
export type { WelcomeEmailProps } from './templates/welcome-verify/schema';

/**
 * Reset Password Email
 */
export { resetPasswordSchema } from './templates/reset-password/schema';
export type { ResetPasswordProps } from './templates/reset-password/schema';


// ============================================================================
// Re-exports for Convenience
// ============================================================================

/**
 * Re-export commonly used Zod utilities
 */
export { z } from 'zod';

/**
 * Re-export nodemailer types
 */
export type { SendMailOptions, Transporter } from 'nodemailer';
