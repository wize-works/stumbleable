import { ClerkProvider } from '@clerk/nextjs';
import Script from 'next/script';
import { ReactNode } from 'react';
import { Header } from '../components/header';
import { ToasterProvider } from '../components/toaster';
import './globals.css';

// Force dynamic rendering to prevent static generation during Docker builds
// This is necessary because ClerkProvider validates API keys during static generation
export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Stumbleable',
    description: 'One button. Curated randomness. Human taste + AI vibes.',
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
    },
};

const fontAwesomeKitUrl = process.env.NEXT_PUBLIC_FONTAWESOME_KIT_URL || "https://kit.fontawesome.com/fab812572f.js";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider>
            <html lang="en" data-theme="light">
                <body className="min-h-screen bg-base-100">

                    <ToasterProvider>
                        <Header />
                        <main className="flex-1">
                            {children}
                        </main>
                    </ToasterProvider>
                    <Script src={fontAwesomeKitUrl} crossOrigin="anonymous" strategy="afterInteractive" />
                </body>
            </html>
        </ClerkProvider>
    );
}