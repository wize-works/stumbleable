'use client';

import { useToaster } from '@/components/toaster';
import { CrawlerAPI } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface CrawlerJob {
    id: string;
    source_id: string;
    status: 'running' | 'completed' | 'failed';
    started_at: string;
    completed_at?: string;
    items_found: number;
    items_submitted: number;
    items_failed: number;
    error_message?: string;
}

interface CrawlerSource {
    id: string;
    name: string;
    type: 'rss' | 'sitemap' | 'web';
    url: string;
}

interface HistoryItem {
    id: string;
    job_id: string;
    source_id: string;
    url: string;
    title?: string;
    discovered_at: string;
    submitted: boolean;
    error_message?: string;
}

interface JobDetailModalProps {
    job: CrawlerJob;
    source?: CrawlerSource;
    onClose: () => void;
    onJobUpdated?: () => void;
}

export default function JobDetailModal({ job: initialJob, source, onClose, onJobUpdated }: JobDetailModalProps) {
    const { getToken } = useAuth();
    const { showToast } = useToaster();
    const [job, setJob] = useState(initialJob);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Auto-refresh for running jobs
    useEffect(() => {
        if (job.status !== 'running') return;

        const interval = setInterval(async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const updatedJob = await CrawlerAPI.getJob(job.id, token);
                setJob(updatedJob);

                // If job is no longer running, stop polling and notify parent
                if (updatedJob.status !== 'running') {
                    if (onJobUpdated) onJobUpdated();
                }
            } catch (error) {
                console.error('Error refreshing job:', error);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [job.status, job.id, getToken, onJobUpdated]);

    // Load history
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const historyData = await CrawlerAPI.getJobHistory(job.id, token, 100);
                setHistory(historyData);
            } catch (error) {
                console.error('Error loading history:', error);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [job.id, getToken]);

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this crawl job?')) return;

        setCancelling(true);
        try {
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            const result = await CrawlerAPI.cancelJob(job.id, token);
            showToast(result.message, 'success');

            // Refresh job status
            const updatedJob = await CrawlerAPI.getJob(job.id, token);
            setJob(updatedJob);

            if (onJobUpdated) onJobUpdated();
        } catch (error) {
            console.error('Error cancelling job:', error);
            showToast(`Failed to cancel job: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            setCancelling(false);
        }
    };

    const duration = job.completed_at
        ? Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)
        : Math.round((Date.now() - new Date(job.started_at).getTime()) / 1000);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-base-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-base-300">
                    <div>
                        <h2 className="text-2xl font-bold">Crawl Job Details</h2>
                        {source && (
                            <p className="text-sm text-base-content/60 mt-1">
                                Source: <span className="font-medium">{source.name}</span>
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <i className="fa-solid fa-duotone fa-xmark text-xl"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Status Banner */}
                    <div
                        className={`alert mb-6 ${job.status === 'completed'
                            ? 'alert-success'
                            : job.status === 'failed'
                                ? 'alert-error'
                                : 'alert-warning'
                            }`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <i
                                    className={`fa-solid fa-duotone ${job.status === 'completed'
                                        ? 'fa-check-circle'
                                        : job.status === 'failed'
                                            ? 'fa-exclamation-circle'
                                            : 'fa-spinner fa-spin'
                                        } text-2xl`}
                                />
                                <div>
                                    <p className="font-bold text-lg capitalize">{job.status}</p>
                                    <p className="text-sm opacity-80">
                                        {job.status === 'running'
                                            ? `Running for ${duration}s...`
                                            : `Duration: ${duration}s`}
                                    </p>
                                </div>
                            </div>
                            {job.status === 'running' && (
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className="btn btn-sm btn-error"
                                >
                                    {cancelling ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Cancelling...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-duotone fa-stop"></i>
                                            Cancel Job
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {job.error_message && (
                        <div className="alert alert-error mb-6">
                            <i className="fa-solid fa-duotone fa-exclamation-triangle"></i>
                            <div>
                                <p className="font-bold">Error Details:</p>
                                <p className="text-sm font-mono">{job.error_message}</p>
                            </div>
                        </div>
                    )}

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="stat bg-base-200 rounded-lg">
                            <div className="stat-title">Items Found</div>
                            <div className="stat-value text-primary">{job.items_found}</div>
                            <div className="stat-desc">URLs discovered</div>
                        </div>
                        <div className="stat bg-base-200 rounded-lg">
                            <div className="stat-title">Submitted</div>
                            <div className="stat-value text-success">{job.items_submitted}</div>
                            <div className="stat-desc">Successfully processed</div>
                        </div>
                        <div className="stat bg-base-200 rounded-lg">
                            <div className="stat-title">Failed</div>
                            <div className="stat-value text-error">{job.items_failed}</div>
                            <div className="stat-desc">Processing errors</div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-base-200 rounded-lg p-4">
                            <p className="text-sm text-base-content/60 mb-1">Job ID</p>
                            <p className="font-mono text-sm">{job.id}</p>
                        </div>
                        <div className="bg-base-200 rounded-lg p-4">
                            <p className="text-sm text-base-content/60 mb-1">Source ID</p>
                            <p className="font-mono text-sm">{job.source_id}</p>
                        </div>
                        <div className="bg-base-200 rounded-lg p-4">
                            <p className="text-sm text-base-content/60 mb-1">Started At</p>
                            <p className="text-sm">{new Date(job.started_at).toLocaleString()}</p>
                        </div>
                        <div className="bg-base-200 rounded-lg p-4">
                            <p className="text-sm text-base-content/60 mb-1">
                                {job.completed_at ? 'Completed At' : 'Status'}
                            </p>
                            <p className="text-sm">
                                {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'In Progress...'}
                            </p>
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="border-t border-base-300 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Crawl History</h3>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="btn btn-sm btn-ghost"
                            >
                                {showHistory ? 'Hide' : 'Show'} URLs ({history.length})
                                <i className={`fa-solid fa-duotone fa-chevron-${showHistory ? 'up' : 'down'} ml-2`}></i>
                            </button>
                        </div>

                        {showHistory && (
                            <div className="bg-base-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="text-center py-8">
                                        <span className="loading loading-spinner loading-lg"></span>
                                        <p className="text-sm text-base-content/60 mt-2">Loading history...</p>
                                    </div>
                                ) : history.length === 0 ? (
                                    <p className="text-center text-base-content/60 py-8">No URLs in history</p>
                                ) : (
                                    <div className="space-y-2">
                                        {history.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`p-3 rounded-lg ${item.submitted
                                                    ? 'bg-success/10 border border-success/20'
                                                    : 'bg-error/10 border border-error/20'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{item.title || 'Untitled'}</p>
                                                        <p className="text-xs text-base-content/60 truncate">{item.url}</p>
                                                        {item.error_message && (
                                                            <p className="text-xs text-error mt-1">{item.error_message}</p>
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`badge badge-sm ${item.submitted ? 'badge-success' : 'badge-error'
                                                            }`}
                                                    >
                                                        {item.submitted ? 'Submitted' : 'Failed'}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-base-content/40 mt-1">
                                                    {new Date(item.discovered_at).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-base-300 p-4 flex justify-end">
                    <button onClick={onClose} className="btn btn-primary">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
