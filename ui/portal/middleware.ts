import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/admin(.*)',
    '/stumble(.*)',
    '/saved(.*)',
    '/lists(.*)',
    '/submit(.*)'
]);

// Sign-out page should be accessible regardless of auth state
const isPublicRoute = createRouteMatcher([
    '/sign-out'
]);

export default clerkMiddleware(
    async (auth, req) => {
        // Allow public routes without authentication
        if (isPublicRoute(req)) {
            return;
        }

        // Only protect specific routes
        if (isProtectedRoute(req)) {
            // Environment variables will handle the redirect URLs
            await auth.protect();
        }
    },
    {
        // Include both development and production domains
        authorizedParties: [
            'https://stumbleable.com',
            'https://www.stumbleable.com',
            'http://localhost:3000',  // Development
            'http://127.0.0.1:3000'   // Alternative localhost
        ],
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