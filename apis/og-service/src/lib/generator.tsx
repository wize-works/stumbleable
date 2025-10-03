import { ImageResponse } from '@vercel/og';
import React from 'react';
import type { OGImageParams } from '../types';

/**
 * Generate OG image using @vercel/og
 */
export async function generateOGImage(params: OGImageParams): Promise<Buffer> {
    const {
        title,
        description = '',
        type = 'default',
        theme = 'light'
    } = params;

    // Brand colors
    const colors = {
        primary: '#6366f1', // Indigo
        secondary: '#8b5cf6', // Purple
        accent: '#ec4899', // Pink
        background: theme === 'dark' ? '#1e293b' : '#ffffff',
        text: theme === 'dark' ? '#f1f5f9' : '#0f172a',
        muted: theme === 'dark' ? '#94a3b8' : '#64748b'
    };

    // Use the actual brand favicon
    // Note: In production, this would be fetched from your domain
    // For now, we'll use a placeholder that matches your brand
    const logoUrl = 'https://stumbleable.com/android-chrome-512x512.png';

    // Generate the image using React-like JSX
    const imageResponse = new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.background,
                    backgroundImage: type === 'default'
                        ? `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary}15 100%)`
                        : colors.background,
                    padding: '80px',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
            >
                {/* Logo/Brand */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '48px',
                        gap: '20px'
                    }}
                >
                    <img
                        src={logoUrl}
                        alt="Stumbleable Logo"
                        width={72}
                        height={72}
                        style={{
                            borderRadius: '18px',
                            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
                        }}
                    />
                    <div
                        style={{
                            fontSize: '42px',
                            fontWeight: 'bold',
                            color: colors.text,
                            letterSpacing: '-0.02em'
                        }}
                    >
                        Stumbleable
                    </div>
                </div>

                {/* Main Title */}
                <div
                    style={{
                        fontSize: title.length > 50 ? '56px' : '72px',
                        fontWeight: 'bold',
                        color: colors.text,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        maxWidth: '900px',
                        marginBottom: description ? '32px' : '0',
                        letterSpacing: '-0.03em'
                    }}
                >
                    {title}
                </div>

                {/* Description */}
                {description && (
                    <div
                        style={{
                            fontSize: '32px',
                            color: colors.muted,
                            textAlign: 'center',
                            maxWidth: '800px',
                            lineHeight: 1.5
                        }}
                    >
                        {description}
                    </div>
                )}

                {/* Bottom Badge - Improved positioning */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '18px 36px',
                        borderRadius: '999px',
                        backgroundColor: colors.background,
                        border: `3px solid ${colors.primary}`,
                        boxShadow: '0 4px 24px rgba(99, 102, 241, 0.25)'
                    }}
                >
                    <span style={{ fontSize: '26px', color: colors.primary, fontWeight: 700 }}>
                        Discovery free forever
                    </span>
                    <span style={{ fontSize: '26px', color: colors.muted, fontWeight: 400 }}>
                        •
                    </span>
                    <span style={{ fontSize: '26px', color: colors.muted, fontWeight: 500 }}>
                        No ads
                    </span>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );

    // Convert to buffer
    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Generate cache key for OG image
 */
export function generateCacheKey(params: OGImageParams): string {
    const { title, description, type, theme } = params;
    return `og-${type}-${theme}-${title.slice(0, 50)}-${description?.slice(0, 30)}`.replace(/[^a-z0-9-]/gi, '-');
}
