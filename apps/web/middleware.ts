import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that require authentication
const protectedPaths = ["/admin", "/api/protected"];

export default async function middleware(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
        const { pathname } = req.nextUrl;

        // Check if the current path is one of the protected paths
        const isProtected = protectedPaths.some(path => pathname.startsWith(path));

        // CSRF Prevention: Check Origin/Referer for state-changing requests
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            const origin = req.headers.get('origin');
            const referer = req.headers.get('referer');
            const host = req.headers.get('host'); // e.g. localhost:3000

            // If origin is present, it must match host
            if (origin) {
                const originHost = new URL(origin).host;
                if (originHost !== host) {
                    console.error(`[CSRF] Origin Mismatch: ${originHost} vs ${host}`);
                    return new NextResponse("CSRF Violation: Origin Mimatch", { status: 403 });
                }
            }
            // If no origin, check referer
            else if (referer) {
                const refererHost = new URL(referer).host;
                if (refererHost !== host) {
                    console.error(`[CSRF] Referer Mismatch: ${refererHost} vs ${host}`);
                    return new NextResponse("CSRF Violation: Referer Mismatch", { status: 403 });
                }
            }
            // Strict blocking if neither is present (optional, can be too strict for some clients)
            else {
                console.warn("[CSRF] Missing Origin and Referer");
                // return new NextResponse("CSRF Violation: Missing Headers", { status: 403 });
            }
        }

        if (isProtected) {
            if (!token) {
                // unauthorized
                const url = req.nextUrl.clone();
                url.pathname = '/'; // or /login
                return NextResponse.redirect(url);
            }
        }

        return NextResponse.next();
    } catch (error) {
        console.error("[Middleware] Critical Error:", error);
        // Fail safe to 500 error, but avoid redirect loop if possible
        return new NextResponse("Internal Server Error (Middleware)", { status: 500 });
    }
}

// Configure which paths the middleware runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/auth (next-auth routes must be public)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
    ],
};
