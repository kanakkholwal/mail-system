import { z } from "zod";

// --- Branding Schema ---

export const socialSchema = z.object({
    platform: z.enum(["twitter", "instagram", "linkedin", "github", "facebook", "youtube"]),
    url: z.string().url(),
    iconUrl: z.string().optional(), // Optional custom icon overrides
});

export const brandingSchema = z.object({
    name: z.string(),
    logoUrl: z.string().url(),
    primaryColor: z.string().regex(/^#/, "Must be a hex color").optional(),
    secondaryColor: z.string().regex(/^#/, "Must be a hex color").optional(),
    websiteUrl: z.string().url(),
    address: z.string().optional(),
    socials: z.array(socialSchema).optional(),
});

export type Branding = z.infer<typeof brandingSchema>;

// --- Sender Identity Schema (XOR Validation Example) ---

const recruiterSender = z.object({
    type: z.literal("recruiter"),
    name: z.string(),
    role: z.string(),
    email: z.string().email(),
    avatarUrl: z.string().url().optional(),
});

const automatedSender = z.object({
    type: z.literal("automated"),
    name: z.string().optional(), // e.g. "The Linear Team"
    replyTo: z.string().email().optional(),
});

export const senderSchema = z.discriminatedUnion("type", [
    recruiterSender,
    automatedSender,
]);

export type Sender = z.infer<typeof senderSchema>;

// --- Base Template Props ---

export interface BaseTemplateProps {
    branding?: Partial<Branding>; // Allow runtime overrides
    previewText?: string;
}