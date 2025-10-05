import { ClerkProvider } from '@clerk/nextjs';
import Script from 'next/script';
import { ReactNode } from 'react';
import { CookieConsent } from '../components/cookie-consent';
import { Footer } from '../components/footer';
import { Header } from '../components/header';
import { ToasterProvider } from '../components/toaster';
import { UserInitializer } from '../components/user-initializer';
import { UserInitializationProvider } from '../lib/user-initialization-context';
import './globals.css';

// Force dynamic rendering to prevent static generation during Docker builds
// This is necessary because ClerkProvider validates API keys during static generation
export const dynamic = 'force-dynamic';

export const metadata = {
    metadataBase: new URL('https://stumbleable.com'),
    title: {
        default: 'Stumbleable - Best StumbleUpon Alternative | Discover Amazing Websites',
        template: '%s | Stumbleable'
    },
    description: 'Discover amazing websites with one click! Free random website generator & content discovery tool. The #1 StumbleUpon alternative in 2025. Start exploring now!',
    applicationName: 'Stumbleable',
    keywords: [
        'stumbleupon alternative',
        'random website generator',
        'discover new websites',
        'web discovery tool',
        'content discovery',
        'serendipity',
        'random website',
        'explore internet',
        'website recommendation',
        'stumbleupon replacement'
    ],
    authors: [{ name: 'Stumbleable' }],
    creator: 'Stumbleable',
    publisher: 'Stumbleable',
    manifest: '/site.webmanifest',
    alternates: {
        canonical: '/'
    },
    icons: {
        icon: [
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon.ico', sizes: 'any' },
        ],
        apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Stumbleable',
    },
    formatDetection: {
        telephone: false,
    },
    openGraph: {
        type: 'website',
        siteName: 'Stumbleable',
        title: 'Stumbleable - Rediscover the Magic of Web Discovery',
        description: 'Discover amazing websites with one click! The #1 StumbleUpon alternative. Discovery free forever.',
        url: 'https://stumbleable.com',
        locale: 'en_US',
        images: [
            {
                url: '/og-image-homepage.png',
                width: 1200,
                height: 630,
                alt: 'Stumbleable - Discover Amazing Websites',
                type: 'image/png'
            },
            {
                url: '/android-chrome-512x512.png',
                width: 512,
                height: 512,
                alt: 'Stumbleable Logo',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        site: '@stumbleable',
        creator: '@stumbleable',
        title: 'Stumbleable - Best StumbleUpon Alternative',
        description: 'Discover amazing websites with one click! Free random website generator. Start exploring now! 🎲',
        images: ['/og-image-homepage.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#1d232a' },
    ],
};

const fontAwesomeKitUrl = process.env.NEXT_PUBLIC_FONTAWESOME_KIT_URL || "https://kit.fontawesome.com/fab812572f.js";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/onboarding"
        >
            <html lang="en" suppressHydrationWarning>
                <head>
                    <meta name="helpninja-verification" content="e2f6f6f7-0bf6-453f-b630-472d371db6b6" />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                                try {
                                    const theme = localStorage.getItem('theme') || 
                                        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                                    document.documentElement.setAttribute('data-theme', theme);
                                } catch (e) {}
                            `,
                        }}
                    />
                </head>
                <body className="min-h-screen bg-base-100">

                    <ToasterProvider>
                        <UserInitializationProvider>
                            <UserInitializer />
                            <Header />
                            <main className="flex-1">
                                {children}
                            </main>
                            <Footer />
                            <CookieConsent />
                        </UserInitializationProvider>
                    </ToasterProvider>
                    <Script src={fontAwesomeKitUrl} crossOrigin="anonymous" strategy="afterInteractive" />
                    <Script async src="https://helpninja.app/api/widget?t=hn_pk_sGLps5fACfWmzntqum9f6dmR&s=3ab35ffe-11fe-4a35-b609-8cbd826979ce&k=e2f6f6f7-0bf6-453f-b630-472d371db6b6&voice=casual" />

                </body>
            </html>
        </ClerkProvider>
    );
}