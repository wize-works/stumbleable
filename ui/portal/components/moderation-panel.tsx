'use client';

import { useToaster } from '@/components/toaster';
import { UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface ModerationItem {
    id: string;
    url: string;
    title: string;
    description?: string;
    domain: string;
    issues: string[];
    confidence_score: number;
    status: 'pending' | 'approved' | 'rejected' | 'reviewing';
    created_at: string;
}

interface ContentReport {
    id: string;
    reason: string;
    description?: string;
    status: 'pending' | 'resolved' | 'dismissed';
    created_at: string;
    discoveries: {
        id: string;
        url: string;
        title: string;
        domain: string;
    };
}

export default function ModerationPanel() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const { showToast } = useToaster();
    const [activeTab, setActiveTab] = useState<'queue' | 'reports'>('queue');
    const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
    const [contentReports, setContentReports] = useState<ContentReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<'user' | 'moderator' | 'admin' | null>(null);
    const [checkingRole, setCheckingRole] = useState(true);

    // Check user role using proper RBAC
    useEffect(() => {
        const checkRole = async () => {
            if (!user?.id) {
                setCheckingRole(false);
                return;
            }

            try {
                const token = await getToken();
                if (!token) {
                    setCheckingRole(false);
                    return;
                }

                const roleData = await UserAPI.getMyRole(token);
                setUserRole(roleData.role);
            } catch (error) {
                console.error('Error checking user role:', error);
                setUserRole(null);
            } finally {
                setCheckingRole(false);
            }
        };

        checkRole();
    }, [user, getToken]);

    // Check if user has moderator or admin role
    const hasModeratorAccess = userRole === 'moderator' || userRole === 'admin';

    useEffect(() => {
        if (!hasModeratorAccess || checkingRole) return;

        fetchModerationData();
    }, [hasModeratorAccess, checkingRole]);

    const fetchModerationData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [queueResponse, reportsResponse] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_DISCOVERY_API_URL}/api/moderation/queue?status=pending&limit=50`),
                fetch(`${process.env.NEXT_PUBLIC_DISCOVERY_API_URL}/api/reports?status=pending`)
            ]);

            if (!queueResponse.ok || !reportsResponse.ok) {
                throw new Error('Failed to fetch moderation data');
            }

            const queueData = await queueResponse.json();
            const reportsData = await reportsResponse.json();

            setModerationQueue(queueData.queue || []);
            setContentReports(reportsData.reports || []);
        } catch (error) {
            console.error('Error fetching moderation data:', error);
            setError('Failed to load moderation data');
        } finally {
            setLoading(false);
        }
    };

    const handleModerationDecision = async (itemId: string, decision: 'approve' | 'reject', notes?: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DISCOVERY_API_URL}/api/moderation/queue/${itemId}/decide`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        decision,
                        moderatorNotes: notes,
                        moderatorId: user?.id
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to process moderation decision');
            }

            // Remove the item from the queue
            setModerationQueue(prev => prev.filter(item => item.id !== itemId));

            // Show success message
            showToast(`Content ${decision}d successfully`, 'success');
        } catch (error) {
            console.error('Error processing moderation decision:', error);
            showToast('Failed to process moderation decision', 'error');
        }
    };

    const handleReportResolution = async (reportId: string, status: 'resolved' | 'dismissed', notes?: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DISCOVERY_API_URL}/api/reports/${reportId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status,
                        moderatorNotes: notes,
                        moderatorId: user?.id
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to resolve report');
            }

            // Remove the report from the list
            setContentReports(prev => prev.filter(report => report.id !== reportId));

            showToast(`Report ${status} successfully`, 'success');
        } catch (error) {
            console.error('Error resolving report:', error);
            showToast('Failed to resolve report', 'error');
        }
    };

    if (checkingRole) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (!hasModeratorAccess) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-base-content mb-4">Access Denied</h1>
                    <p className="text-base-content/70">This page is restricted to moderators and administrators.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-error mb-4">Error</h1>
                    <p className="text-base-content/70 mb-4">{error}</p>
                    <button onClick={fetchModerationData} className="btn btn-primary">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-base-content mb-8">Content Moderation</h1>

                {/* Tab Navigation */}
                <div className="tabs tabs-bordered mb-8">
                    <button
                        className={`tab tab-lg ${activeTab === 'queue' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('queue')}
                    >
                        Moderation Queue ({moderationQueue.length})
                    </button>
                    <button
                        className={`tab tab-lg ${activeTab === 'reports' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        Content Reports ({contentReports.length})
                    </button>
                </div>

                {/* Moderation Queue */}
                {activeTab === 'queue' && (
                    <div className="space-y-6">
                        {moderationQueue.length === 0 ? (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-semibold text-base-content mb-2">No pending content</h3>
                                <p className="text-base-content/70">All submitted content has been reviewed.</p>
                            </div>
                        ) : (
                            moderationQueue.map((item) => (
                                <div key={item.id} className="card bg-base-200 shadow-md">
                                    <div className="card-body">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="card-title text-base-content">{item.title}</h3>
                                                <p className="text-base-content/70 text-sm mb-2">{item.url}</p>
                                                {item.description && (
                                                    <p className="text-base-content/80 text-sm mb-3">{item.description}</p>
                                                )}
                                            </div>
                                            <div className="badge badge-warning">
                                                {Math.round(item.confidence_score * 100)}% confidence
                                            </div>
                                        </div>

                                        {/* Issues */}
                                        <div className="mb-4">
                                            <p className="text-sm font-semibold text-base-content mb-2">Issues detected:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.issues.map((issue, index) => (
                                                    <span key={index} className="badge badge-error badge-sm">
                                                        {issue.replace(/-/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Domain Info */}
                                        <div className="mb-4">
                                            <p className="text-sm text-base-content/70">
                                                Domain: <span className="font-mono">{item.domain}</span>
                                            </p>
                                            <p className="text-sm text-base-content/70">
                                                Submitted: {new Date(item.created_at).toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="card-actions justify-end">
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => handleModerationDecision(item.id, 'approve')}
                                            >
                                                <i className="fa-solid fa-duotone fa-check mr-2"></i>
                                                Approve
                                            </button>
                                            <button
                                                className="btn btn-error btn-sm"
                                                onClick={() => handleModerationDecision(item.id, 'reject')}
                                            >
                                                <i className="fa-solid fa-duotone fa-times mr-2"></i>
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Content Reports */}
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        {contentReports.length === 0 ? (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-semibold text-base-content mb-2">No pending reports</h3>
                                <p className="text-base-content/70">No users have reported content issues.</p>
                            </div>
                        ) : (
                            contentReports.map((report) => (
                                <div key={report.id} className="card bg-base-200 shadow-md">
                                    <div className="card-body">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="card-title text-base-content">{report.discoveries.title}</h3>
                                                <p className="text-base-content/70 text-sm mb-2">{report.discoveries.url}</p>
                                                {report.description && (
                                                    <p className="text-base-content/80 text-sm mb-3">
                                                        Report details: {report.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="badge badge-warning">
                                                {report.reason.replace(/-/g, ' ')}
                                            </div>
                                        </div>

                                        {/* Report Info */}
                                        <div className="mb-4">
                                            <p className="text-sm text-base-content/70">
                                                Domain: <span className="font-mono">{report.discoveries.domain}</span>
                                            </p>
                                            <p className="text-sm text-base-content/70">
                                                Reported: {new Date(report.created_at).toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="card-actions justify-end">
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => handleReportResolution(report.id, 'resolved')}
                                            >
                                                <i className="fa-solid fa-duotone fa-check mr-2"></i>
                                                Resolve
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleReportResolution(report.id, 'dismissed')}
                                            >
                                                <i className="fa-solid fa-duotone fa-times mr-2"></i>
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}