import { ReactNode } from 'react';

/**
 * Launch Landing Pages Layout
 * 
 * Shared layout for all platform launch pages with:
 * - Analytics tracking
 * - Consistent styling
 * - SEO optimization
 */

interface LaunchLayoutProps {
    children: ReactNode;
}

export default function LaunchLayout({ children }: LaunchLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100">
            {/* Analytics tracking is handled per-page via metadata */}
            {children}
        </div>
    );
}
