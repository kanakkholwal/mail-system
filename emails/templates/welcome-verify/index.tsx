import { Button } from "@emails/kit/components/button";
import { Footer } from "@emails/kit/components/footer";
import { Header } from "@emails/kit/components/header";
import { Layout } from "@emails/kit/components/layout";
import { BodyText, H1, SubText } from "@emails/kit/components/typography";
import { Branding } from "@emails/kit/types";
import { Section } from "@react-email/components";
import { WelcomeEmailProps } from "./schema";

// Default branding fallback - This should ideally come from a global config
const defaultBranding: Branding = {
    name: "Nexonauts",
    logoUrl: "https://nexonauts.com/assets/logo.svg",
    websiteUrl: "https://nexonauts.com",
    primaryColor: "#007291",
    socials: [
        { platform: "twitter", url: "https://twitter.com/nexonauts" },
        { platform: "github", url: "https://github.com/nexonauts" },
    ],
};

export const WelcomeEmail = ({
    name,
    verificationUrl,
    email,
    branding: brandingOverride,
}: WelcomeEmailProps) => {
    const branding = { ...defaultBranding, ...brandingOverride };

    return (
        <Layout previewText={`Welcome to ${branding.name}! Please verify your email.`}>
            <Header branding={branding} />

            <Section className="my-6">
                <H1>Welcome to {branding.name}</H1>
                <BodyText>
                    Hi {name},
                </BodyText>
                <BodyText>
                    We're thrilled to have you on board. To get full access to the platform and start your journey, please verify your email address.
                </BodyText>

                <Section className="my-8 text-center">
                    <Button href={verificationUrl}>Verify Account</Button>
                </Section>

                <BodyText>
                    This link will expire in 24 hours. If you didn't create an account with {branding.name}, you can safely ignore this email.
                </BodyText>
            </Section>

            <SubText className="mt-8 pt-4 border-t border-gray-100">
                This email was sent to <span className="font-medium text-gray-700">{email}</span>.
            </SubText>

            <Footer branding={branding} />
        </Layout>
    );
};

export default WelcomeEmail;