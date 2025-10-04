'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
    label: string;
    href: string;
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    const pathname = usePathname();

    // Auto-generate breadcrumbs from pathname if not provided
    const breadcrumbs = items || generateBreadcrumbs(pathname);

    return (
        <div className="text-sm breadcrumbs mb-6">
            <ul>
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                        <li key={item.href}>
                            {isLast ? (
                                <span className="text-base-content/70">{item.label}</span>
                            ) : (
                                <Link
                                    href={item.href}
                                    className="text-primary hover:underline"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/**
 * Auto-generate breadcrumbs from pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    for (const path of paths) {
        currentPath += `/${path}`;
        const label = formatLabel(path);
        breadcrumbs.push({ label, href: currentPath });
    }

    return breadcrumbs;
}

/**
 * Format URL segment into readable label
 */
function formatLabel(segment: string): string {
    // Handle common patterns
    const labelMap: Record<string, string> = {
        'admin': 'Admin Dashboard',
        'moderation': 'Content Moderation',
        'sources': 'Crawler Sources',
        'deletion-requests': 'Deletion Requests',
        'saved': 'Saved Items',
        'lists': 'Lists',
        'stumble': 'Stumble',
        'about': 'About',
        'dashboard': 'Dashboard',
    };

    if (labelMap[segment]) {
        return labelMap[segment];
    }

    // Convert kebab-case to Title Case
    return segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
