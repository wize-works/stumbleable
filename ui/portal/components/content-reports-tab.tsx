'use client';

import { useToaster } from '@/components/toaster';
import { ContentReport, ModerationAPI } from '@/lib/api-client';
import { useState } from 'react';

interface ContentReportsTabProps {
    reports: ContentReport[];
    loading: boolean;
    onRefresh: () => void;
    token: string | null;
}

export default function ContentReportsTab({ reports, loading, onRefresh, token }: ContentReportsTabProps) {
    const { showToast } = useToaster();
    const [processing, setProcessing] = useState<Set<string>>(new Set());
    const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

    const toggleExpanded = (reportId: string) => {
        setExpandedReports(prev => {
            const next = new Set(prev);
            if (next.has(reportId)) {
                next.delete(reportId);
            } else {
                next.add(reportId);
            }
            return next;
        });
    };

    const handleResolve = async (reportId: string, status: 'resolved' | 'dismissed', notes?: string) => {
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        setProcessing(prev => new Set(prev).add(reportId));

        try {
            await ModerationAPI.resolveReport(reportId, status, notes, token);
            showToast(`Report ${status} successfully`, 'success');
            onRefresh();
        } catch (error) {
            console.error('Error resolving report:', error);
            showToast('Failed to resolve report', 'error');
        } finally {
            setProcessing(prev => {
                const next = new Set(prev);
                next.delete(reportId);
                return next;
            });
        }
    };

    const getReasonBadgeClass = (reason: string): string => {
        const reasonMap: Record<string, string> = {
            'spam': 'badge-error',
            'inappropriate': 'badge-warning',
            'broken-link': 'badge-info',
            'misleading': 'badge-warning',
            'copyright': 'badge-error',
            'other': 'badge-neutral',
        };
        return reasonMap[reason] || 'badge-neutral';
    };

    const getTrustScoreColor = (score: number): string => {
        if (score >= 0.8) return 'text-success';
        if (score >= 0.5) return 'text-warning';
        return 'text-error';
    };

    const getAccuracyColor = (rate: number): string => {
        if (rate >= 70) return 'text-success';
        if (rate >= 40) return 'text-warning';
        return 'text-error';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="text-center py-12">
                <i className="fa-solid fa-duotone fa-flag text-6xl text-base-content/30 mb-4"></i>
                <h3 className="text-lg font-semibold text-base-content mb-2">No pending reports</h3>
                <p className="text-base-content/70">No users have reported content issues.</p>
            </div>
        );
    }

    return (
        <div className="columns-1 md:columns-2 gap-6 space-y-6">
            {reports.map((report) => {
                const isProcessing = processing.has(report.id);
                const isExpanded = expandedReports.has(report.id);

                return (
                    <div key={report.id} className="card bg-base-200 shadow-md break-inside-avoid-column">
                        <div className="card-body">
                            {/* Header: Title and Badges */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="card-title text-base-content">
                                        {report.content?.title || 'Reported Content'}
                                    </h3>
                                    <div className={`badge ${getReasonBadgeClass(report.reason)} badge-lg`}>
                                        {report.reason.replace(/-/g, ' ')}
                                    </div>
                                    {report.domain_reputation?.is_blacklisted && (
                                        <div className="badge badge-error gap-1">
                                            <i className="fa-solid fa-duotone fa-ban text-xs"></i>
                                            Blacklisted
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content Preview Section - MAIN FOCUS */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                                {/* Left: Image Preview */}
                                <div className="lg:col-span-1">
                                    {report.content?.image_url ? (
                                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-base-300">
                                            <img
                                                src={report.content.image_url}
                                                alt={report.content.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23ddd" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" font-size="20">No Image</text></svg>';
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-base-300 flex items-center justify-center">
                                            <i className="fa-solid fa-duotone fa-image text-6xl text-base-content/30"></i>
                                        </div>
                                    )}

                                    {/* View Content Button - PROMINENT */}
                                    {report.content?.url && (
                                        <a
                                            href={report.content.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary btn-block mt-2"
                                        >
                                            <i className="fa-solid fa-duotone fa-external-link mr-2"></i>
                                            View Reported Content
                                        </a>
                                    )}
                                </div>

                                {/* Right: Content Details */}
                                <div className="lg:col-span-2 space-y-3">
                                    {/* URL - Always visible and copyable */}
                                    {report.content?.url && (
                                        <div className="bg-base-300 rounded-lg p-3">
                                            <div className="text-xs font-semibold text-base-content/70 mb-1">URL</div>
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm text-primary flex-1 break-all">
                                                    {report.content.url}
                                                </code>
                                                <button
                                                    className="btn btn-ghost btn-xs"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(report.content?.url || '');
                                                        showToast('URL copied!', 'success');
                                                    }}
                                                    title="Copy URL"
                                                >
                                                    <i className="fa-solid fa-duotone fa-copy"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Content Description - Full text, not truncated */}
                                    {report.content?.description && (
                                        <div className="bg-base-300 rounded-lg p-3">
                                            <div className="text-xs font-semibold text-base-content/70 mb-1">Content Description</div>
                                            <p className="text-sm text-base-content/90 leading-relaxed">
                                                {report.content.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Metadata Grid */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {report.content?.domain && (
                                            <div className="bg-base-300 rounded-lg p-2">
                                                <div className="text-xs text-base-content/70">Domain</div>
                                                <div className="font-mono text-sm font-semibold">{report.content.domain}</div>
                                            </div>
                                        )}
                                        {report.content?.reading_time_minutes && (
                                            <div className="bg-base-300 rounded-lg p-2">
                                                <div className="text-xs text-base-content/70">Read Time</div>
                                                <div className="text-sm font-semibold">{report.content.reading_time_minutes} min</div>
                                            </div>
                                        )}
                                        {report.content?.published_at && (
                                            <div className="bg-base-300 rounded-lg p-2">
                                                <div className="text-xs text-base-content/70">Published</div>
                                                <div className="text-sm font-semibold">
                                                    {new Date(report.content.published_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                        {report.content?.created_at && (
                                            <div className="bg-base-300 rounded-lg p-2">
                                                <div className="text-xs text-base-content/70">Added to Platform</div>
                                                <div className="text-sm font-semibold">
                                                    {new Date(report.content.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Topics */}
                                    {report.content?.topics && report.content.topics.length > 0 && (
                                        <div>
                                            <div className="text-xs font-semibold text-base-content/70 mb-2">Topics</div>
                                            <div className="flex flex-wrap gap-1">
                                                {report.content.topics.map((topic) => (
                                                    <span key={topic} className="badge badge-outline badge-sm">
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reporter's Comments - PROMINENT */}
                            {report.description && (
                                <div className="alert alert-warning mb-4">
                                    <i className="fa-solid fa-duotone fa-exclamation-triangle text-2xl"></i>
                                    <div className="flex-1">
                                        <p className="font-bold text-base mb-1">Why This Was Reported:</p>
                                        <p className="text-base font-medium">{report.description}</p>
                                        {report.reported_by_user && (
                                            <p className="text-sm mt-2 opacity-80">
                                                Reported by {report.reported_by_user.full_name || report.reported_by_user.email} on{' '}
                                                {new Date(report.created_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Key Decision Metrics - Always Visible */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {/* Engagement Stats */}
                                <div className="stat bg-base-300 rounded-lg p-3">
                                    <div className="stat-title text-xs">Engagement</div>
                                    <div className="stat-value text-2xl">
                                        {(report.engagement?.views_count || 0) +
                                            (report.engagement?.likes_count || 0) +
                                            (report.engagement?.saves_count || 0)}
                                    </div>
                                    <div className="stat-desc text-xs">
                                        {report.engagement?.views_count || 0} views •
                                        {report.engagement?.likes_count || 0} likes
                                    </div>
                                </div>

                                {/* Domain Trust Score */}
                                {report.domain_reputation && (
                                    <div className="stat bg-base-300 rounded-lg p-3">
                                        <div className="stat-title text-xs">Domain Trust</div>
                                        <div className={`stat-value text-2xl ${getTrustScoreColor(report.domain_reputation.trust_score)}`}>
                                            {Math.round(report.domain_reputation.trust_score * 100)}%
                                        </div>
                                        <div className="stat-desc text-xs">
                                            {report.domain_reputation.total_approved} approved •
                                            {report.domain_reputation.total_rejected} rejected
                                        </div>
                                    </div>
                                )}

                                {/* Reporter Accuracy */}
                                {report.reporter_history && (
                                    <div className="stat bg-base-300 rounded-lg p-3">
                                        <div className="stat-title text-xs">Reporter Accuracy</div>
                                        <div className={`stat-value text-2xl ${getAccuracyColor(report.reporter_history.accuracy_rate)}`}>
                                            {report.reporter_history.accuracy_rate}%
                                        </div>
                                        <div className="stat-desc text-xs">
                                            {report.reporter_history.resolved_reports}/{report.reporter_history.total_reports} reports confirmed
                                        </div>
                                    </div>
                                )}

                                {/* Similar Reports */}
                                {report.similar_reports_count !== undefined && report.similar_reports_count > 0 && (
                                    <div className="stat bg-base-300 rounded-lg p-3">
                                        <div className="stat-title text-xs">Similar Reports</div>
                                        <div className="stat-value text-2xl text-error">
                                            {report.similar_reports_count}
                                        </div>
                                        <div className="stat-desc text-xs">
                                            Multiple users reported this
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Expandable Additional Context */}
                            {(report.reporter_history || (report.similar_reports && report.similar_reports.length > 0)) && (
                                <>
                                    <button
                                        className="btn btn-ghost btn-sm mb-2"
                                        onClick={() => toggleExpanded(report.id)}
                                    >
                                        <i className={`fa-solid fa-duotone fa-chevron-${isExpanded ? 'up' : 'down'} mr-2`}></i>
                                        {isExpanded ? 'Hide' : 'Show'} Reporter History & Similar Reports
                                    </button>

                                    {isExpanded && (
                                        <div className="bg-base-300 rounded-lg p-4 space-y-4">
                                            {/* Reporter Detailed History */}
                                            {report.reporter_history && report.reported_by_user && (
                                                <div>
                                                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                                                        <i className="fa-solid fa-duotone fa-user-shield"></i>
                                                        Reporter Credibility Analysis
                                                    </h4>
                                                    <div className="bg-base-100 rounded-lg p-3 space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm">Reporter:</span>
                                                            <span className="font-semibold">
                                                                {report.reported_by_user.full_name || report.reported_by_user.email}
                                                                {report.reported_by_user.role && (
                                                                    <span className="badge badge-sm ml-2 capitalize">{report.reported_by_user.role}</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="divider my-1"></div>
                                                        <div className="grid grid-cols-3 gap-3 text-center">
                                                            <div>
                                                                <div className="text-2xl font-bold text-base-content">
                                                                    {report.reporter_history.total_reports}
                                                                </div>
                                                                <div className="text-xs text-base-content/70">Total Reports</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-2xl font-bold text-success">
                                                                    {report.reporter_history.resolved_reports}
                                                                </div>
                                                                <div className="text-xs text-base-content/70">Confirmed</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-2xl font-bold text-error">
                                                                    {report.reporter_history.dismissed_reports}
                                                                </div>
                                                                <div className="text-xs text-base-content/70">False Reports</div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 p-2 bg-base-200 rounded text-center">
                                                            <span className="text-sm text-base-content/70">Accuracy Rate: </span>
                                                            <span className={`text-lg font-bold ${getAccuracyColor(report.reporter_history.accuracy_rate)}`}>
                                                                {report.reporter_history.accuracy_rate}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Similar Reports Details */}
                                            {report.similar_reports && report.similar_reports.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                                                        <i className="fa-solid fa-duotone fa-clone"></i>
                                                        Other Reports for This Content ({report.similar_reports.length})
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {report.similar_reports.map((similar) => (
                                                            <div key={similar.id} className="bg-base-100 rounded p-2 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`badge ${getReasonBadgeClass(similar.reason)}`}>
                                                                        {similar.reason}
                                                                    </span>
                                                                </div>
                                                                <span className={`badge badge-sm ${similar.status === 'resolved' ? 'badge-success' :
                                                                    similar.status === 'dismissed' ? 'badge-ghost' :
                                                                        'badge-warning'
                                                                    }`}>
                                                                    {similar.status}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {report.similar_reports.length >= 3 && (
                                                        <div className="alert alert-error mt-2">
                                                            <i className="fa-solid fa-duotone fa-exclamation-circle"></i>
                                                            <span className="text-sm font-semibold flex items-center gap-2">
                                                                <i className="fa-solid fa-duotone fa-triangle-exclamation"></i> Multiple users have flagged this content - likely a genuine issue!
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Resolution Notes */}
                            {report.resolution_notes && (
                                <div className="alert alert-info mt-4">
                                    <i className="fa-solid fa-duotone fa-info-circle"></i>
                                    <div>
                                        <p className="text-sm font-semibold">Moderator Notes:</p>
                                        <p className="text-sm">{report.resolution_notes}</p>
                                        {report.resolved_by_user && (
                                            <p className="text-xs mt-1 opacity-70">
                                                By {report.resolved_by_user.full_name || report.resolved_by_user.email} on{' '}
                                                {report.resolved_at ? new Date(report.resolved_at).toLocaleString() : 'N/A'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions (only for pending reports) */}
                            {report.status === 'pending' && (
                                <div className="card-actions justify-end mt-4">
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleResolve(report.id, 'resolved', 'Content issue confirmed and addressed.')}
                                        disabled={isProcessing}
                                        title="Confirm the report is valid and take action"
                                    >
                                        {isProcessing ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                            <i className="fa-solid fa-duotone fa-check mr-2"></i>
                                        )}
                                        Confirm & Resolve
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleResolve(report.id, 'dismissed', 'No issue found. False report.')}
                                        disabled={isProcessing}
                                        title="Dismiss as a false report"
                                    >
                                        {isProcessing ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                            <i className="fa-solid fa-duotone fa-times mr-2"></i>
                                        )}
                                        Dismiss as False
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
