import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Enable standalone output for Docker
    output: 'standalone',

    // Disable telemetry in production
    ...(process.env.NODE_ENV === 'production' && {
        eslint: {
            ignoreDuringBuilds: true,
        },
        typescript: {
            ignoreBuildErrors: false,
        },
    }),
};

export default nextConfig;