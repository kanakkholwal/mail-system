import {
    Body,
    Container,
    Font,
    Head,
    Html,
    Preview,
    Tailwind,
} from "@react-email/components";
import React from "react";
import { emailTailwindConfig } from "../tailwind";
import { Branding } from "../types";

interface LayoutProps {
    children: React.ReactNode;
    previewText?: string;
    branding?: Partial<Branding>; // Passed down for context if needed in future
    lang?: string;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    previewText,
    lang = "en",
}) => {
    return (
        <Html lang={lang}>
            <Head>
                <Font
                    fontFamily="Roboto"
                    fallbackFontFamily="Verdana"
                    webFont={{
                        url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.woff2",
                        format: "woff2",
                    }}
                    fontWeight={400}
                    fontStyle="normal"
                />
            </Head>
            <Preview>{previewText || ""}</Preview>
            <Tailwind config={emailTailwindConfig}>
                <Body className="bg-bg-subtle font-sans text-text-primary m-auto">
                    <Container className="bg-bg-canvas border border-border rounded-lg mx-auto my-10 max-w-[480px] p-8 shadow-sm">
                        {children}
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};