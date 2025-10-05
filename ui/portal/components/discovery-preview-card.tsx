import type { Discovery } from '@/data/types';
import Link from 'next/link';

interface DiscoveryPreviewCardProps {
    discovery: Discovery;
    index?: number;
}

export function DiscoveryPreviewCard({ discovery, index = 0 }: DiscoveryPreviewCardProps) {
    const colors = ['primary', 'secondary', 'accent'] as const;
    const color = colors[index % 3];
    const primaryTopic = discovery.topics?.[0] || 'discovery';
    const description = discovery.description || 'Click to explore this amazing discovery';

    return (
        <div className="card bg-base-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            {/* Image */}
            <figure className="relative h-48 overflow-hidden bg-base-300">
                {discovery.image ? (
                    <img
                        src={discovery.image}
                        alt={discovery.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-${color}/20 to-${color}/5`}>
                        <i className="fa-solid fa-duotone fa-image text-6xl text-base-content/20"></i>
                    </div>
                )}
                {/* Topic badge overlay */}
                <div className="absolute top-3 left-3">
                    <div className={`badge badge-${color} badge-sm`}>
                        {primaryTopic}
                    </div>
                </div>
            </figure>

            {/* Content */}
            <div className="card-body p-6">
                <h4 className="card-title text-base font-bold line-clamp-2 mb-2">
                    {discovery.title}
                </h4>
                <p className="text-sm text-base-content/70 line-clamp-2 mb-4">
                    {description}
                </p>
                <div className=''>
                    {discovery.domain}
                </div>

                {/* CTA Button */}
                <div className="card-actions">
                    <Link
                        href={`/stumble?id=${discovery.id}`}
                        className={`btn btn-${color} w-full group/btn`}
                    >
                        <span>Explore Now</span>
                        <i className="fa-solid fa-duotone fa-arrow-right ml-2 group-hover/btn:translate-x-1 transition-transform"></i>
                    </Link>
                </div>
            </div>
        </div>
    );
}

interface DiscoveryPreviewCardSkeletonProps {
    count?: number;
}

export function DiscoveryPreviewCardSkeleton({ count = 3 }: DiscoveryPreviewCardSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="card bg-base-200 shadow-lg overflow-hidden">
                    <div className="skeleton w-full h-48"></div>
                    <div className="card-body p-6">
                        <div className="skeleton h-4 w-3/4 mb-2"></div>
                        <div className="skeleton h-3 w-full mb-3"></div>
                        <div className="skeleton h-8 w-full"></div>
                    </div>
                </div>
            ))}
        </>
    );
}

interface DiscoveryPreviewCardFallbackProps {
    index?: number;
}

export function DiscoveryPreviewCardFallback({ index = 0 }: DiscoveryPreviewCardFallbackProps) {
    const fallbackData = [
        {
            icon: 'fa-palette',
            topic: 'Art & Design',
            color: 'primary',
            title: 'Creative Inspiration',
            description: 'Discover stunning visual designs and artistic masterpieces'
        },
        {
            icon: 'fa-rocket',
            topic: 'Technology',
            color: 'secondary',
            title: 'Tech Innovation',
            description: 'Explore cutting-edge technology and digital breakthroughs'
        },
        {
            icon: 'fa-mountain',
            topic: 'Adventure',
            color: 'accent',
            title: 'Wild Exploration',
            description: 'Journey to breathtaking destinations and hidden gems'
        },
    ];

    const item = fallbackData[index % 3];

    return (
        <div className="card bg-base-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            {/* Placeholder gradient */}
            <figure className={`relative h-48 bg-gradient-to-br from-${item.color}/30 to-${item.color}/10 flex items-center justify-center`}>
                <i className={`fa-solid fa-duotone ${item.icon} text-6xl text-${item.color}`}></i>
                <div className="absolute top-3 left-3">
                    <div className={`badge badge-${item.color} badge-sm`}>
                        {item.topic}
                    </div>
                </div>
            </figure>

            <div className="card-body p-6">
                <h4 className="card-title text-base font-bold mb-2">
                    {item.title}
                </h4>
                <p className="text-sm text-base-content/70 mb-4">
                    {item.description}
                </p>

                <div className="card-actions">
                    <Link
                        href="/stumble"
                        className={`btn btn-${item.color} btn-sm w-full group/btn`}
                    >
                        <span>Start Exploring</span>
                        <i className="fa-solid fa-arrow-right ml-2 group-hover/btn:translate-x-1 transition-transform"></i>
                    </Link>
                </div>
            </div>
        </div>
    );
}
