import { tokens } from "./tokens";

/**
 * Shared Tailwind config for React Email.
 * This ensures consistency across all templates.
 */
export const emailTailwindConfig = {
    theme: {
        extend: {
            colors: {
                brand: tokens.colors.brand,
                "brand-foreground": tokens.colors.brandForeground,
                text: tokens.colors.text,
                bg: tokens.colors.background,
                border: tokens.colors.border,
            },
            fontFamily: {
                sans: tokens.typography.fontFamily.split(","),
            },
            spacing: tokens.spacing,
            borderRadius: tokens.borderRadius,
            fontSize: tokens.typography.fontSize,
        },
    },
};