import { Button } from "@emails/kit/components/button";
import { Footer } from "@emails/kit/components/footer";
import { Header } from "@emails/kit/components/header";
import { Layout } from "@emails/kit/components/layout";
import { BodyText, H1, SubText } from "@emails/kit/components/typography";
import { Branding } from "@emails/kit/types";
import { Link, Section } from "@react-email/components";
import { ResetPasswordProps } from "./schema";

const defaultBranding: Branding = {
    name: "Nexonauts",
    logoUrl: "https://nexonauts.com/assets/logo.svg",
    websiteUrl: "https://nexonauts.com",
    primaryColor: "#007291",
};

export const ResetPasswordEmail = ({
    name,
    resetUrl,
    email,
    validMinutes,
    branding: brandingOverride,
}: ResetPasswordProps) => {
    const branding = { ...defaultBranding, ...brandingOverride };

    return (
        <Layout previewText="Reset your password">
            <Header branding={branding} />

            <Section className="my-6">
                <H1>Reset your password</H1>
                <BodyText>Hi {name},</BodyText>
                <BodyText>
                    We received a request to reset the password for your account associated with <strong>{email}</strong>.
                </BodyText>
                <BodyText>
                    No changes have been made to your account yet. You can reset your password by clicking the link below:
                </BodyText>

                <Section className="my-8 text-center">
                    <Button href={resetUrl} variant="primary">
                        Reset Password
                    </Button>
                </Section>

                <SubText>
                    Or copy and paste this URL into your browser:
                    <br />
                    <Link href={resetUrl} className="text-brand break-all">
                        {resetUrl}
                    </Link>
                </SubText>

                <BodyText className="mt-6">
                    This link will expire in {validMinutes} minutes. If you did not request a password reset, please ignore this email.
                </BodyText>
            </Section>

            <Footer branding={branding} />
        </Layout>
    );
};

export default ResetPasswordEmail;