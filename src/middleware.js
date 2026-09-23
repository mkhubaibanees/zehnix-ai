import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(async (auth, request) => {
    // 1. Get the current URL path
    const { pathname } = request.nextUrl;

    // 2. Define public routes manually to avoid the deprecated createRouteMatcher
    const isPublicRoute = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

    // 3. Protect all other routes (forces redirect to sign-in if not logged in)
    if (!isPublicRoute) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};