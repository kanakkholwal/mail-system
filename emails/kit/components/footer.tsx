import { Column, Link, Row, Section, Text } from "@react-email/components";
import React from "react";
import { Branding } from "../types";

interface FooterProps {
    branding: Branding;
}

export const Footer: React.FC<FooterProps> = ({ branding }) => {
    return (
        <Section className="mt-8 pt-8 border-t border-gray-100">
            {branding.socials && branding.socials.length > 0 && (
                <Row className="mb-6">
                    <Column align="center">
                        <div className="flex justify-center gap-4">
                            {/* Simplified social rendering - in prod, map these to specific icons or use a generic one */}
                            {branding.socials.map((social) => (
                                <Link
                                    key={social.platform}
                                    href={social.url}
                                    className="text-gray-400 mx-2 text-xs uppercase tracking-wider font-semibold no-underline"
                                >
                                    {social.platform}
                                </Link>
                            ))}
                        </div>
                    </Column>
                </Row>
            )}

            <Text className="text-xs text-center text-gray-400 m-0">
                © {new Date().getFullYear()} {branding.name}. All rights reserved.
            </Text>
            {branding.address && (
                <Text className="text-xs text-center text-gray-400 m-0 mt-2">
                    {branding.address}
                </Text>
            )}
            <div className="text-center mt-4">
                <Link href={branding.websiteUrl} className="text-xs text-gray-400 underline">
                    Visit Website
                </Link>
            </div>
        </Section>
    );
};