import z from "zod";


export const mailerPayloadSchema = z.object({
    to: z.array(z.string().email()),
    subject: z.string(),
    html: z.string(),
})

export type MailerPayload = z.infer<typeof mailerPayloadSchema>
