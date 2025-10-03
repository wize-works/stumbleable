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
            await auth.protect();
        }
    },
    {
        // Use custom authentication pages instead of Clerk hosted pages
        signInUrl: '/sign-in',
        signUpUrl: '/sign-up',
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