'use client';

import { UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Topic {
    id: string;
    name: string;
    category?: string;
}

interface SubmissionResult {
    success: boolean;
    discovery?: any;
    error?: string;
    details?: {
        issues?: string[];
        suggestions?: string[];
        confidence?: number;
    };
}

export default function SubmitPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();

    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);
    const [topicsLoading, setTopicsLoading] = useState(true);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

    // Iframe preview state
    const [showPreview, setShowPreview] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [iframeError, setIframeError] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Topics pagination state (2 rows × 3 columns = 6 topics per page)
    const [topicsPage, setTopicsPage] = useState(0);
    const topicsPerPage = 6;
    const totalTopicsPages = Math.ceil(availableTopics.length / topicsPerPage);
    const paginatedTopics = availableTopics.slice(
        topicsPage * topicsPerPage,
        (topicsPage + 1) * topicsPerPage
    );

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    // Load available topics
    useEffect(() => {
        async function loadTopics() {
            if (!isSignedIn) return;

            try {
                const token = await getToken();
                if (!token) return;

                const topics = await UserAPI.getTopics(token);
                setAvailableTopics(topics);
            } catch (error) {
                console.error('Error loading topics:', error);
            } finally {
                setTopicsLoading(false);
            }
        }

        if (isLoaded && isSignedIn) {
            loadTopics();
        }
    }, [isLoaded, isSignedIn, getToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            setSubmissionResult({
                success: false,
                error: 'URL is required'
            });
            return;
        }

        setLoading(true);
        setSubmissionResult(null);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_CRAWLER_API_URL}/api/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    url: url.trim(),
                    title: title.trim() || undefined,
                    description: description.trim() || undefined,
                    topics: selectedTopics.length > 0 ? selectedTopics : undefined,
                    userId: user?.id // Track who submitted the content
                })
            });

            const result = await response.json();

            if (!response.ok) {
                setSubmissionResult({
                    success: false,
                    error: result.reason || result.error || 'Failed to submit content',
                    details: result.details
                });
                return;
            }

            setSubmissionResult({
                success: true,
                discovery: result.discovery
            });

            // Reset form
            setUrl('');
            setTitle('');
            setDescription('');
            setSelectedTopics([]);

        } catch (error) {
            console.error('Error submitting content:', error);
            setSubmissionResult({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to submit content'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTopicToggle = (topicId: string) => {
        setSelectedTopics(prev =>
            prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId].slice(0, 5) // Max 5 topics
        );
    };

    const isValidUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            // Only accept HTTPS URLs
            return urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    };

    // Load iframe preview when URL changes (debounced)
    useEffect(() => {
        // Clear any existing timeout
        if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
        }

        // Reset states
        setIframeError(false);
        setShowPreview(false);

        // Only show preview for valid URLs
        if (!url || !isValidUrl(url)) {
            return;
        }

        // Debounce: wait 1 second after user stops typing
        const timeoutId = setTimeout(() => {
            setShowPreview(true);
            setPreviewLoading(true);

            // Set timeout for iframe load detection
            const loadTimeout = setTimeout(() => {
                setPreviewLoading(false);
                setIframeError(true);
            }, 5000); // 5 second timeout

            previewTimeoutRef.current = loadTimeout;
        }, 1000);

        previewTimeoutRef.current = timeoutId;

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [url]);

    if (!isLoaded || topicsLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading loading-spinner loading-xl text-primary"></div>
                    <span className="text-xl">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading loading-spinner loading-xl text-primary"></div>
                    <span className="text-xl">Redirecting to sign in...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">Submit Content <i className='fa-solid fa-duotone fa-arrow-up-from-bracket' /></h1>
                    <p className="text-lg text-base-content/70">
                        Share something amazing for others to discover
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    {/* Success Message */}
                    {submissionResult?.success && (
                        <div className="alert alert-success mb-6">
                            <i className="fa-solid fa-duotone fa-check-circle"></i>
                            <div>
                                <h3 className="font-bold">Content submitted successfully!</h3>
                                <div className="text-sm">
                                    Your content "{submissionResult.discovery?.title}" has been added to the discovery pool.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {submissionResult?.error && (
                        <div className="alert alert-error mb-6">
                            <i className="fa-solid fa-duotone fa-exclamation-circle"></i>
                            <div className="flex-1">
                                <h3 className="font-bold">Submission rejected</h3>
                                <div className="text-sm mt-1">{submissionResult.error}</div>
                                {(submissionResult as any).details && (
                                    <div className="mt-3 space-y-2">
                                        {(submissionResult as any).details.suggestions && (
                                            <div className="bg-base-100/20 rounded p-3">
                                                <div className="font-medium mb-1 flex items-center gap-2">
                                                    <i className="fa-solid fa-duotone fa-lightbulb text-warning"></i> Suggestions:
                                                </div>
                                                <ul className="list-disc list-inside space-y-1 text-xs">
                                                    {(submissionResult as any).details.suggestions.map((suggestion: string, idx: number) => (
                                                        <li key={idx}>{suggestion}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Submission Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* URL Field */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">URL *</span>
                            </label>
                            <input
                                type="url"
                                placeholder="https://example.com/amazing-article"
                                className={`input input-bordered w-full ${url && !isValidUrl(url) ? 'input-error' : ''
                                    }`}
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                            />
                            {url && !isValidUrl(url) && (
                                <label className="label">
                                    <span className="label-text-alt text-error">
                                        {url.startsWith('http://')
                                            ? 'Please use HTTPS instead of HTTP for security'
                                            : 'Please enter a valid HTTPS URL (must start with https://)'}
                                    </span>
                                </label>
                            )}
                        </div>

                        {/* Iframe Preview Section */}
                        {showPreview && isValidUrl(url) && (
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Site Preview</span>
                                    <span className="label-text-alt text-base-content/60">
                                        See how the site loads before submitting
                                    </span>
                                </label>
                                <div className="relative border-2 border-base-300 rounded-lg overflow-hidden bg-base-200" style={{ height: '400px' }}>
                                    {/* Loading Overlay */}
                                    {previewLoading && (
                                        <div className="absolute inset-0 bg-base-100/95 backdrop-blur-sm flex items-center justify-center z-10">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="loading loading-spinner loading-lg text-primary"></div>
                                                <span className="text-sm text-base-content/70">Loading preview...</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Warning */}
                                    {iframeError && !previewLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center p-6 bg-base-200">
                                            <div className="alert alert-warning max-w-md">
                                                <i className="fa-solid fa-duotone fa-triangle-exclamation text-2xl"></i>
                                                <div>
                                                    <h3 className="font-bold">Preview Not Available</h3>
                                                    <div className="text-sm mt-1">
                                                        This site may block embedding or took too long to load.
                                                        You can still submit it - we'll extract the content details automatically.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Iframe */}
                                    <iframe
                                        ref={iframeRef}
                                        key={url}
                                        src={url}
                                        className="w-full h-full border-0"
                                        title="Site Preview"
                                        sandbox="allow-scripts allow-same-origin allow-forms"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        onLoad={() => {
                                            if (previewTimeoutRef.current) {
                                                clearTimeout(previewTimeoutRef.current);
                                            }
                                            setPreviewLoading(false);
                                            setIframeError(false);
                                        }}
                                        onError={() => {
                                            setPreviewLoading(false);
                                            setIframeError(true);
                                        }}
                                    />

                                    {/* Success Indicator (when loaded successfully) */}
                                    {!previewLoading && !iframeError && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <div className="badge badge-success gap-2">
                                                <i className="fa-solid fa-duotone fa-check-circle"></i>
                                                Preview loaded
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <label className="label">
                                    <span className="label-text-alt flex items-center gap-1">
                                        <i className="fa-solid fa-duotone fa-lightbulb text-warning"></i> This preview shows you if the site will load properly for users
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Title Field (Optional) */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Title (Optional)</span>
                                <span className="label-text-alt">We'll extract this automatically if not provided</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Leave blank to auto-extract from the page"
                                className="input input-bordered w-full"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={200}
                            />
                        </div>

                        {/* Description Field (Optional) */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Description (Optional)</span>
                                <span className="label-text-alt">We'll extract this automatically if not provided</span>
                            </label>
                            <textarea
                                placeholder="Leave blank to auto-extract from the page"
                                className="textarea textarea-bordered h-24 w-full"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={500}
                            />
                        </div>

                        {/* Topics Selection */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Topics (Optional)</span>
                                <span className="label-text-alt">Select up to 5 topics, or let us classify automatically</span>
                            </label>

                            {/* Paginated Topics Grid */}
                            <div className="border-2 border-base-300 rounded-lg p-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-h-[180px]">
                                    {paginatedTopics.map((topic) => (
                                        <button
                                            key={topic.id}
                                            type="button"
                                            onClick={() => handleTopicToggle(topic.id)}
                                            className={`p-3 rounded-lg border-2 text-sm transition-all duration-200 ${selectedTopics.includes(topic.id)
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-base-300 hover:border-primary/50'
                                                }`}
                                            disabled={!selectedTopics.includes(topic.id) && selectedTopics.length >= 5}
                                        >
                                            <div className="font-medium capitalize">{topic.name}</div>
                                            {topic.category && (
                                                <div className="text-xs text-base-content/60 mt-1">
                                                    {topic.category}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalTopicsPages > 1 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300">
                                        <button
                                            type="button"
                                            onClick={() => setTopicsPage(p => Math.max(0, p - 1))}
                                            disabled={topicsPage === 0}
                                            className="btn btn-sm btn-ghost"
                                        >
                                            <i className="fa-solid fa-duotone fa-chevron-left"></i>
                                            Previous
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-base-content/60">
                                                Page {topicsPage + 1} of {totalTopicsPages}
                                            </span>
                                            {/* Page dots */}
                                            <div className="flex gap-1.5">
                                                {Array.from({ length: totalTopicsPages }, (_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setTopicsPage(i)}
                                                        className={`w-2 h-2 rounded-full transition-all ${i === topicsPage
                                                            ? 'bg-primary w-6'
                                                            : 'bg-base-300 hover:bg-base-400'
                                                            }`}
                                                        aria-label={`Go to page ${i + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setTopicsPage(p => Math.min(totalTopicsPages - 1, p + 1))}
                                            disabled={topicsPage === totalTopicsPages - 1}
                                            className="btn btn-sm btn-ghost"
                                        >
                                            Next
                                            <i className="fa-solid fa-duotone fa-chevron-right"></i>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {selectedTopics.length > 0 && (
                                <label className="label">
                                    <span className="label-text-alt">
                                        {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
                                    </span>
                                </label>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-between items-center pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={loading || url.trim().length === 0 || (url !== '' && !isValidUrl(url))}
                                className="btn btn-primary"
                            >
                                {loading && <span className="loading loading-spinner"></span>}
                                {loading ? 'Submitting...' : 'Submit Content'}
                            </button>
                        </div>
                    </form>

                    {/* Help Text */}
                    <div className="mt-8 p-4 bg-base-200 rounded-lg">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-duotone fa-clipboard-list"></i> Submission Guidelines
                        </h3>
                        <ul className="text-sm space-y-1 text-base-content/70">
                            <li>• Only <strong>HTTPS</strong> URLs are accepted for security (no HTTP)</li>
                            <li>• We'll automatically extract metadata if you don't provide it</li>
                            <li>• Duplicate URLs will be rejected</li>
                            <li>• Content will be reviewed and classified automatically</li>
                            <li>• Your submission will be available for discovery immediately</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}