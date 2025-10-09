import Image from 'next/image';
import { useState } from 'react';
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
    hasIframeError?: boolean; // Indicates if content can't be iframed
    isInModal?: boolean; // If true, renders without card wrapper
}

export function DiscoveryCard({
    discovery,
    className = '',
    showTrending = true,
    isTrending = false,
    reason,
    onReportSuccess,
    hasIframeError = false,
    isInModal = false
}: DiscoveryCardProps) {
    // Prefer stored image path over external URL
    const imageUrl = discovery.imageStoragePath || discovery.image;
    const faviconUrl = discovery.faviconUrl;

    // State to track image load errors
    const [imageError, setImageError] = useState(false);
    const [faviconError, setFaviconError] = useState(false);

    // Fallback placeholder image
    const placeholderImage = '/og-image-homepage.png';

    const content = (
        <>
            {/* Iframe Error Notice - Shown at top for visibility */}
            {hasIframeError && (
                <div className="bg-warning/10 border-2 border-warning/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                            <i className="fa-solid fa-duotone fa-shield-exclamation text-warning text-lg"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-warning mb-1 flex items-center gap-2">
                                Content Protection Active
                            </h4>
                            <p className="text-sm text-base-content/70 leading-relaxed">
                                The original website has security settings that prevent embedding. This is their choice to protect their content, not a limitation on our end. You can view the full content by clicking the link below to open it directly.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Image with enhanced visual treatment */}
            {(imageUrl || placeholderImage) && (
                <figure className="relative overflow-hidden group rounded-2xl mb-6">
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                    <Image
                        src={imageError ? placeholderImage : imageUrl || placeholderImage}
                        alt={discovery.title}
                        width={600}
                        height={320}
                        className="w-full h-64 sm:h-80 object-cover transform group-hover:scale-105 transition-transform duration-500"
                        priority={false}
                        unoptimized={!discovery.imageStoragePath || imageError}
                        onError={() => {
                            console.log(`Image failed to load for ${discovery.title}, using placeholder`);
                            setImageError(true);
                        }}
                    />
                    {imageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-base-200/50 backdrop-blur-sm z-5">
                            <div className="text-center p-4">
                                <i className="fa-solid fa-duotone fa-image-slash text-4xl text-base-content/30 mb-2"></i>
                                <p className="text-xs text-base-content/50">Original image unavailable</p>
                            </div>
                        </div>
                    )}
                    {isTrending && (
                        <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-secondary text-secondary-content font-bold shadow-lg backdrop-blur-sm flex items-center gap-2 z-20">
                            <i className="fa-solid fa-duotone fa-fire text-lg"></i>
                            <span>Trending</span>
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 px-3 py-2 rounded-full bg-neutral/90 backdrop-blur-md text-neutral-content font-medium shadow-lg flex items-center gap-2 border border-neutral-content/20 z-20">
                        {faviconUrl && !faviconError ? (
                            <Image
                                src={faviconUrl}
                                alt={`${discovery.domain} icon`}
                                width={16}
                                height={16}
                                className="inline-block rounded-sm"
                                unoptimized
                                onError={() => {
                                    console.log(`Favicon failed to load for ${discovery.domain}`);
                                    setFaviconError(true);
                                }}
                            />
                        ) : (
                            <i className="fa-solid fa-duotone fa-globe text-sm"></i>
                        )}
                        <span className="text-sm">{discovery.domain}</span>
                    </div>
                </figure>
            )}

            {/* Title and Link - More prominent */}
            <h2 className="text-2xl sm:text-3xl mb-4 leading-tight font-bold">
                <a
                    href={discovery.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base-content hover:text-primary transition-all duration-200 focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-base-100 rounded-lg group inline-flex items-center gap-2"
                >
                    <span>{discovery.title}</span>
                    <i className="fa-solid fa-duotone fa-arrow-up-right-from-square text-base opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
                </a>
            </h2>

            {/* Description - More readable */}
            {discovery.description && (
                <p className="text-base sm:text-lg text-base-content/75 mb-6 leading-relaxed">
                    {discovery.description}
                </p>
            )}

            {/* Meta info - More visual */}
            <div className="flex items-center gap-4 mb-6">
                {discovery.readingTime && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <i className="fa-solid fa-duotone fa-clock text-sm"></i>
                        <span className="text-sm font-medium">{formatreadingTime(discovery.readingTime)}</span>
                    </div>
                )}
                {discovery.createdAt && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                        <i className="fa-solid fa-duotone fa-calendar text-sm"></i>
                        <span className="text-sm font-medium">{formatTimeAgo(discovery.createdAt)}</span>
                    </div>
                )}
            </div>

            {/* Topics - More colorful and engaging */}
            {discovery.topics.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <i className="fa-solid fa-duotone fa-tags text-accent text-lg"></i>
                        <span className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">Topics</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {discovery.topics.slice(0, 5).map((topicId) => {
                            const topic = topicsById.get(topicId);
                            return topic ? (
                                <span
                                    key={topicId}
                                    className="px-3 py-1.5 rounded-full bg-accent/20 text-base-content border border-accent/30 text-sm font-medium hover:bg-accent/30 transition-all duration-200 cursor-default"
                                >
                                    {topic.name}
                                </span>
                            ) : null;
                        })}
                        {discovery.topics.length > 5 && (
                            <span className="px-3 py-1.5 rounded-full bg-base-200 text-base-content/60 text-sm font-medium border border-base-300">
                                +{discovery.topics.length - 5} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Why you're seeing this - More engaging */}
            {reason && (
                <div className="bg-info/5 border-l-4 border-info pl-4 py-3 mb-4 rounded-r-lg">
                    <div className="flex items-start gap-2">
                        <i className="fa-solid fa-duotone fa-lightbulb text-info text-lg mt-0.5"></i>
                        <div>
                            <p className="text-xs font-semibold text-info uppercase tracking-wide mb-1">Why This Discovery?</p>
                            <p className="text-sm text-base-content/70 leading-relaxed">{reason}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action buttons - More prominent */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-base-200">
                <a
                    href={discovery.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-md gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                    <i className="fa-solid fa-duotone fa-external-link"></i>
                    <span>Visit Source</span>
                </a>
                <ReportContentButton
                    discoveryId={discovery.id}
                    onReportSuccess={onReportSuccess}
                />
            </div>
        </>
    );

    // If in modal, return content without card wrapper
    if (isInModal) {
        return <div className="discovery-content">{content}</div>;
    }

    // Otherwise, return with card wrapper
    return (
        <article className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-base-300 hover:border-primary/20 ${className}`}>
            <div className="card-body p-6 sm:p-8">
                {content}
            </div>
        </article>
    );
}

