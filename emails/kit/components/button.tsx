import { Button as ReactEmailButton } from "@react-email/components";
import React from "react";

interface ButtonProps {
    href: string;
    children: React.ReactNode;
    fullWidth?: boolean;
    variant?: "primary" | "secondary";
}

export const Button: React.FC<ButtonProps> = ({
    href,
    children,
    fullWidth = true,
    variant = "primary",
}) => {
    const baseStyles =
        "px-6 py-3 rounded-md font-medium text-center no-underline block";

    // Note: We use style injection for colors to support dynamic overrides more easily if needed,
    // but utility classes work fine with the Tailwind wrapper too.
    const variants = {
        primary: "bg-brand text-white hover:opacity-90",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    };

    return (
        <ReactEmailButton
            className={`${baseStyles} ${variants[variant]} ${fullWidth ? "w-full" : "w-auto"
                }`}
            href={href}
        >
            {children}
        </ReactEmailButton>
    );
};