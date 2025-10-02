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
        <div className="space-y-6">
            {reports.map((report) => {
                const isProcessing = processing.has(report.id);

                return (
                    <div key={report.id} className="card bg-base-200 shadow-md">
                        <div className="card-body">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="card-title text-base-content">
                                        {report.content?.title || 'Reported Content'}
                                    </h3>
                                    {report.content?.url && (
                                        <a
                                            href={report.content.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary text-sm hover:underline"
                                        >
                                            {report.content.url}
                                        </a>
                                    )}
                                    {report.description && (
                                        <p className="text-base-content/80 text-sm mt-2">
                                            <span className="font-semibold">Report details:</span> {report.description}
                                        </p>
                                    )}
                                </div>
                                <div className={`badge ${getReasonBadgeClass(report.reason)} badge-lg ml-4`}>
                                    {report.reason.replace(/-/g, ' ')}
                                </div>
                            </div>

                            {/* Report Metadata */}
                            <div className="bg-base-300 rounded-lg p-3 mb-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {report.content?.domain && (
                                        <div>
                                            <span className="text-base-content/70">Domain:</span>{' '}
                                            <span className="font-mono text-base-content">{report.content.domain}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-base-content/70">Status:</span>{' '}
                                        <span className="capitalize text-base-content">{report.status}</span>
                                    </div>
                                    {report.reported_by_user && (
                                        <div>
                                            <span className="text-base-content/70">Reported by:</span>{' '}
                                            <span className="text-base-content">
                                                {report.reported_by_user.full_name || report.reported_by_user.email}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-base-content/70">Reported:</span>{' '}
                                        <span className="text-base-content">
                                            {new Date(report.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Resolution Notes */}
                            {report.moderator_notes && (
                                <div className="alert alert-info mb-4">
                                    <i className="fa-solid fa-duotone fa-info-circle"></i>
                                    <div>
                                        <p className="text-sm font-semibold">Moderator Notes:</p>
                                        <p className="text-sm">{report.moderator_notes}</p>
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
                                <div className="card-actions justify-end">
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleResolve(report.id, 'resolved')}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                            <i className="fa-solid fa-duotone fa-check mr-2"></i>
                                        )}
                                        Resolve
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleResolve(report.id, 'dismissed')}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                            <i className="fa-solid fa-duotone fa-times mr-2"></i>
                                        )}
                                        Dismiss
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
