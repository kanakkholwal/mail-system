import ResetPasswordEmail from "./templates/reset-password";
import { resetPasswordSchema } from "./templates/reset-password/schema";
import WelcomeEmail from "./templates/welcome-verify";
import { welcomeEmailSchema } from "./templates/welcome-verify/schema";

/**
 * The Registry is the Source of Truth for all email templates.
 * It maps keys to their Component and Zod Schema.
 */
export const registry = {
    "welcome_verify": {
        component: WelcomeEmail,
        schema: welcomeEmailSchema,
    },
    "reset_password": {
        component: ResetPasswordEmail,
        schema: resetPasswordSchema,
    },
} as const;

export type TemplateKey = keyof typeof registry;