import { SMTP_SETTINGS } from "@/project.config";
import nodemailer from "nodemailer";
import z from "zod";

// Simplified schema for the transporter, focusing on what nodemailer expects
export const mailerPayloadSchema = z.object({
  to: z.array(z.string().email()),
  subject: z.string(),
  html: z.string(),
});

export type MailerPayload = z.infer<typeof mailerPayloadSchema>;

export const handleEmailFire = async (from: string, data: MailerPayload) => {
  const res = mailerPayloadSchema.safeParse(data);
  if (!res.success) {
    throw new Error(res.error.message);
  }

  const transporter = nodemailer.createTransport({
    ...SMTP_SETTINGS,
  });

  return await transporter.sendMail({
    from: from,
    ...res.data,
  });
};