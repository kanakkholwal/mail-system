

export const APPLICATION_NAME = "Nexonauts";
export const ORG_DOMAIN = "nexonauts.com";
export const ORG_NAME = "Nexonauts";


export const SENDER_EMAIL = `noreply@${ORG_DOMAIN}`;
export const SENDER = `${APPLICATION_NAME} <${SENDER_EMAIL}>`;



export const IDENTITY_KEY = process.env.SERVER_IDENTITY;

if(!IDENTITY_KEY) {
    throw new Error("Missing SERVER_IDENTITY in environment variables");
}

const SMTP_HOST = process.env.SMTP_HOST;
const MAIL_EMAIL = process.env.MAIL_EMAIL;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;


if(!MAIL_EMAIL || !MAIL_PASSWORD || !SMTP_HOST) {
    throw new Error("Missing MAIL_EMAIL or MAIL_PASSWORD in environment variables");
}


export const SMTP_SETTINGS = {
    host: SMTP_HOST ||"smtp-relay.sendinblue.com", // "smtp.gmail.com", //replace with your email provider
    port: 587,
    // secure: false, // true for 465, false for other ports
    auth: {
        user: MAIL_EMAIL,
        pass: MAIL_PASSWORD,
    },
}