import { config as appConfig } from "@/project.config";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // This ensures that only authorized services (or your backend) can trigger emails.
    if (pathname.startsWith("/api")) {
        const requestIdentityKey = request.headers.get("X-Authorization");
        const serverIdentityKey = appConfig.security.identityKey;

        // Strict equality check for the API key
        if (!requestIdentityKey || requestIdentityKey !== serverIdentityKey) {
            console.warn(
                `[Middleware] ⛔ Unauthorized API access attempt to ${pathname} from IP: ${(request?.headers.get("ip") || request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || request.headers.get("X-Real-IP")) ?? "unknown"}`
            );

            return NextResponse.json(
                {
                    error: "Unauthorized",
                    message: "Missing or invalid X-Authorization header."
                },
                { status: 401 }
            );
        }
    }

    // If a user navigates to the root URL in a browser, redirect them to the 
    // main organization website. This prevents the mail server from serving 
    // a generic Next.js 404 or default page.
    if (pathname === "/") {
        // Ensure the URL has a protocol
        const redirectUrl = appConfig.app.domain.startsWith("http")
            ? appConfig.app.domain
            : `https://${appConfig.app.domain}`;

        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
}

/**
 * -----------------------------------------------------------------------------
 * MATCHER CONFIGURATION
 * -----------------------------------------------------------------------------
 * Defines which paths this middleware runs on.
 * * We EXCLUDE:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * - public folder assets (svgs, etc)
 * * We INCLUDE:
 * - /api/* (Crucial for security)
 * - / (Root path for redirect)
 */
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)",
    ],
};