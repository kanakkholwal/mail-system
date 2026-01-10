import { Img, Section } from "@react-email/components";
import React from "react";
import { Branding } from "../types";

interface HeaderProps {
    branding: Branding;
}

export const Header: React.FC<HeaderProps> = ({ branding }) => {
    return (
        <Section className="mb-8">
            <Img
                src={branding.logoUrl}
                alt={branding.name}
                height="32"
                className="block"
            />
        </Section>
    );
};