import { Heading, Text as ReactEmailText } from "@react-email/components";
import React from "react";

interface TextProps {
    children: React.ReactNode;
    className?: string;
}

export const H1: React.FC<TextProps> = ({ children, className = "" }) => (
    <Heading
        as="h1"
        className={`text-xl font-bold text-text-primary m-0 mb-4 ${className}`}
    >
        {children}
    </Heading>
);

export const H2: React.FC<TextProps> = ({ children, className = "" }) => (
    <Heading
        as="h2"
        className={`text-lg font-semibold text-text-primary m-0 mb-3 ${className}`}
    >
        {children}
    </Heading>
);

export const BodyText: React.FC<TextProps> = ({ children, className = "" }) => (
    <ReactEmailText
        className={`text-base leading-relaxed text-text-primary m-0 mb-4 ${className}`}
    >
        {children}
    </ReactEmailText>
);

export const SubText: React.FC<TextProps> = ({ children, className = "" }) => (
    <ReactEmailText
        className={`text-sm leading-normal text-text-secondary m-0 mb-2 ${className}`}
    >
        {children}
    </ReactEmailText>
);