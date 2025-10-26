export interface LaunchPlatform {
    id: string;
    name: string;
    slug: string;
    display_name: string;
    launch_date: string;
    url: string;
    description: string;
    tagline: string;
    color: string;
    icon: string;
    badge_icon: string;
    stats: {
        followers?: string;
        upvotes?: string;
        comments?: string;
        views?: string;
    };
    testimonials: Array<{
        text: string;
        author: string;
        role: string;
        platform: string;
    }>;
    cta_primary: string;
    cta_secondary: string;
    seo_title: string;
    seo_description: string;
    seo_keywords: string[];
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface CreatePlatformRequest {
    name: string;
    slug: string;
    display_name: string;
    launch_date: string;
    url: string;
    description: string;
    tagline: string;
    color: string;
    icon: string;
    badge_icon: string;
    stats?: Record<string, string>;
    testimonials?: Array<{
        text: string;
        author: string;
        role: string;
        platform: string;
    }>;
    cta_primary: string;
    cta_secondary: string;
    seo_title: string;
    seo_description: string;
    seo_keywords: string[];
    is_active?: boolean;
    sort_order?: number;
}

export interface UpdatePlatformRequest {
    name?: string;
    display_name?: string;
    launch_date?: string;
    url?: string;
    description?: string;
    tagline?: string;
    color?: string;
    icon?: string;
    badge_icon?: string;
    stats?: Record<string, string>;
    testimonials?: Array<{
        text: string;
        author: string;
        role: string;
        platform: string;
    }>;
    cta_primary?: string;
    cta_secondary?: string;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string[];
    is_active?: boolean;
    sort_order?: number;
}
