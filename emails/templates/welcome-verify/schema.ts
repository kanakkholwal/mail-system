import { z } from "zod";
import { brandingSchema } from "../../kit/types";

export const welcomeEmailSchema = z.object({
    name: z.string(),
    verificationUrl: z.string().url(),
    email: z.string().email(),
    // Optional local overrides for branding per email
    branding: brandingSchema.partial().optional(),
});

export type WelcomeEmailProps = z.infer<typeof welcomeEmailSchema>;