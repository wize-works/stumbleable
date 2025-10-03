import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/admin(.*)',
    '/stumble(.*)',
    '/saved(.*)',
    '/lists(.*)',
    '/submit(.*)'
]);

export default clerkMiddleware(
    async (auth, req) => {
        // Only protect specific routes
        if (isProtectedRoute(req)) {
            // Environment variables will handle the redirect URLs
            await auth.protect();
        }
    },
    {
        // Explicitly authorize main domain to prevent subdomain issues
        authorizedParties: ['https://stumbleable.com', 'https://www.stumbleable.com'],
    }
);


export const config = {
    matcher: [
        // Skip Next.js internals, static files, sitemap, and robots
        '/((?!_next|sitemap\\.xml|robots\\.txt|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ]
};