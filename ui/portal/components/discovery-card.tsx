import Image from 'next/image';
import { topicsById } from '../data/topics';
import { Discovery } from '../data/types';
import { formatreadingTime, formatTimeAgo } from '../lib/utils';
import ReportContentButton from './report-content-button';

interface DiscoveryCardProps {
    discovery: Discovery;
    className?: string;
    showTrending?: boolean;
    isTrending?: boolean;
    reason?: string;
    onReportSuccess?: () => void; // Callback when content is reported
}

export function DiscoveryCard({
    discovery,
    className = '',
    showTrending = true,
    isTrending = false,
    reason,
    onReportSuccess
}: DiscoveryCardProps) {
    // Prefer stored image path over external URL
    const imageUrl = discovery.imageStoragePath || discovery.image;
    const faviconUrl = discovery.faviconUrl;

    return (
        <article className={`card bg-base-100 shadow-card hover:shadow-float transition-shadow duration-300 ${className}`}>
            {/* Image */}
            {imageUrl && (
                <figure className="relative">
                    <Image
                        src={imageUrl}
                        alt={discovery.title}
                        width={600}
                        height={320}
                        className="w-full h-64 sm:h-80 object-cover"
                        priority={false}
                        unoptimized={!discovery.imageStoragePath} // Use unoptimized for external URLs
                    />
                    {isTrending && (
                        <div className="absolute top-4 left-4 badge badge-secondary badge-lg">
                            🔥 Trending
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 badge badge-neutral flex items-center gap-2">
                        {faviconUrl && (
                            <Image
                                src={faviconUrl}
                                alt={`${discovery.domain} icon`}
                                width={16}
                                height={16}
                                className="inline-block"
                                unoptimized
                            />
                        )}
                        {discovery.domain}
                    </div>
                </figure>
            )}

            <div className="card-body p-6">
                {/* Title and Link */}
                <h2 className="card-title text-xl sm:text-2xl mb-3 leading-tight">
                    <a
                        href={discovery.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base-content hover:text-primary transition-colors focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    >
                        {discovery.title}
                    </a>
                </h2>

                {/* Description */}
                {discovery.description && (
                    <p className="text-base-content/80 mb-4 leading-relaxed">
                        {discovery.description}
                    </p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-4 text-sm text-base-content/60 mb-4">
                    {discovery.readingTime && (
                        <span>{formatreadingTime(discovery.readingTime)}</span>
                    )}
                    {discovery.createdAt && (
                        <span>{formatTimeAgo(discovery.createdAt)}</span>
                    )}
                </div>

                {/* Topics */}
                {discovery.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {discovery.topics.slice(0, 4).map((topicId) => {
                            const topic = topicsById.get(topicId);
                            return topic ? (
                                <span
                                    key={topicId}
                                    className="badge badge-outline badge-sm"
                                >
                                    {topic.name}
                                </span>
                            ) : null;
                        })}
                        {discovery.topics.length > 4 && (
                            <span className="badge badge-ghost badge-sm">
                                +{discovery.topics.length - 4} more
                            </span>
                        )}
                    </div>
                )}

                {/* Why you're seeing this */}
                {reason && (
                    <div className="text-xs text-base-content/50 italic border-t border-base-200 pt-3 mb-3">
                        Why you&apos;re seeing this: {reason}
                    </div>
                )}

                {/* Report Button */}
                <div className="flex justify-end">
                    <ReportContentButton
                        discoveryId={discovery.id}
                        onReportSuccess={onReportSuccess}
                    />
                </div>
            </div>
        </article>
    );
}

