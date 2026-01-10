import { brandingSchema } from "@emails/kit/types";
import { z } from "zod";

export const resetPasswordSchema = z.object({
    name: z.string(),
    resetUrl: z.string().url(),
    email: z.string().email(),
    validMinutes: z.number().default(30),
    branding: brandingSchema.partial().optional(),
});

export type ResetPasswordProps = z.infer<typeof resetPasswordSchema>;