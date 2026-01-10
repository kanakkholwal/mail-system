export const tokens = {
    colors: {
        brand: "#007291", // Default, can be overridden
        brandForeground: "#ffffff",
        text: {
            primary: "#1a1a1a",
            secondary: "#64748b",
            tertiary: "#94a3b8",
        },
        background: {
            canvas: "#ffffff",
            subtle: "#f8fafc",
        },
        border: "#e2e8f0",
        success: "#10b981",
        error: "#ef4444",
    },
    typography: {
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
        fontSize: {
            xs: "12px",
            sm: "14px",
            base: "16px",
            lg: "18px",
            xl: "24px",
            xxl: "32px",
        },
        lineHeight: {
            tight: "1.25",
            base: "1.5",
            relaxed: "1.625",
        },
        fontWeight: {
            normal: "400",
            medium: "500",
            bold: "700",
        },
    },
    spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
    },
    borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        full: "9999px",
    },
} as const;

export type Tokens = typeof tokens;