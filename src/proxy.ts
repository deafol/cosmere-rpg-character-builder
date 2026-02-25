import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    // Check if maintenance mode is enabled via environment variable
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    const { pathname } = request.nextUrl;

    // 1. If maintenance mode is ON and user is NOT already on the maintenance page
    // 2. We also allow static assets (images, fonts, etc.) to load so the page looks good
    if (
        isMaintenanceMode &&
        !pathname.startsWith('/maintenance') &&
        !pathname.startsWith('/_next') && // Next.js internal static files
        !pathname.includes('/api/') && // Keep APIs functional if needed, or disable if preferred
        !pathname.match(/\.(.*)$/) // Public static files like icons, images
    ) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    // 3. Prevent users from manually visiting /maintenance if mode is OFF
    if (!isMaintenanceMode && pathname.startsWith('/maintenance')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
