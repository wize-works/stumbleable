'use client';

import Breadcrumbs from '@/components/breadcrumbs';
import { useToaster } from '@/components/toaster';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface QueueItem {
    id: string;
    email_type: string;
    recipient_email: string;
    status: 'pending' | 'sent' | 'failed';
    attempts: number;
    max_attempts: number;
    error_message: string | null;
    created_at: string;
    sent_at: string | null;
    scheduled_at: string;
}

interface QueueStats {
    total: number;
    pending: number;
    sent: number;
    failed: number;
}

export default function EmailQueuePage() {
    const { getToken } = useAuth();
    const { showToast } = useToaster();

    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');

    const EMAIL_API_URL = process.env.NEXT_PUBLIC_EMAIL_API_URL || 'http://localhost:7006';

    useEffect(() => {
        loadQueueData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(loadQueueData, 30000);
        return () => clearInterval(interval);
    }, [statusFilter]);

    const loadQueueData = async () => {
        try {
            setLoading(true);
            const token = await getToken();

            // Get queue stats
            const statsResponse = await fetch(`${EMAIL_API_URL}/api/queue/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!statsResponse.ok) {
                throw new Error('Failed to fetch queue stats');
            }

            const statsData = await statsResponse.json();
            setStats(statsData.stats);

            // Get queue items
            const itemsResponse = await fetch(
                `${EMAIL_API_URL}/api/queue/items?status=${statusFilter}&limit=100`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!itemsResponse.ok) {
                throw new Error('Failed to fetch queue items');
            }

            const itemsData = await itemsResponse.json();
            setQueueItems(itemsData.items);
        } catch (error) {
            console.error('Error loading queue data:', error);
            showToast('Failed to load email queue', 'error');
        } finally {
            setLoading(false);
        }
    };

    const triggerQueueProcessing = async () => {
        try {
            setProcessing(true);
            const token = await getToken();

            const response = await fetch(`${EMAIL_API_URL}/api/queue/process`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to trigger queue processing');
            }

            showToast('Queue processing triggered successfully', 'success');

            // Refresh data after a short delay
            setTimeout(() => {
                loadQueueData();
            }, 2000);
        } catch (error) {
            console.error('Error triggering queue:', error);
            showToast('Failed to trigger queue processing', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const retryEmail = async (emailId: string) => {
        try {
            const token = await getToken();

            const response = await fetch(`${EMAIL_API_URL}/api/queue/retry/${emailId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to retry email');
            }

            showToast('Email reset for retry', 'success');
            loadQueueData();
        } catch (error) {
            console.error('Error retrying email:', error);
            showToast('Failed to retry email', 'error');
        }
    };

    const deleteEmail = async (emailId: string) => {
        if (!confirm('Are you sure you want to delete this email from the queue?')) {
            return;
        }

        try {
            const token = await getToken();

            const response = await fetch(`${EMAIL_API_URL}/api/queue/${emailId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete email');
            }

            showToast('Email deleted from queue', 'success');
            loadQueueData();
        } catch (error) {
            console.error('Error deleting email:', error);
            showToast('Failed to delete email', 'error');
        }
    };

    const filteredItems = statusFilter === 'all'
        ? queueItems
        : queueItems.filter(item => item.status === statusFilter);

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-8">
                <Breadcrumbs items={[
                    { label: 'Home', href: '/' },
                    { label: 'Admin Dashboard', href: '/admin' },
                    { label: 'Email Queue', href: '/admin/email-queue' }
                ]} />

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-base-content mb-2">Email Queue Management</h1>
                    <p className="text-base-content/70">
                        Monitor and manage the email queue
                    </p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="stats bg-base-200 shadow">
                            <div className="stat">
                                <div className="stat-figure text-primary">
                                    <i className="fa-solid fa-duotone fa-envelope text-3xl"></i>
                                </div>
                                <div className="stat-title">Total Queued</div>
                                <div className="stat-value text-primary">{stats.total}</div>
                            </div>
                        </div>

                        <div className="stats bg-warning/10 shadow border border-warning/20">
                            <div className="stat">
                                <div className="stat-figure text-warning">
                                    <i className="fa-solid fa-duotone fa-clock text-3xl"></i>
                                </div>
                                <div className="stat-title">Pending</div>
                                <div className="stat-value text-warning">{stats.pending}</div>
                            </div>
                        </div>

                        <div className="stats bg-success/10 shadow border border-success/20">
                            <div className="stat">
                                <div className="stat-figure text-success">
                                    <i className="fa-solid fa-duotone fa-check text-3xl"></i>
                                </div>
                                <div className="stat-title">Sent</div>
                                <div className="stat-value text-success">{stats.sent}</div>
                            </div>
                        </div>

                        <div className="stats bg-error/10 shadow border border-error/20">
                            <div className="stat">
                                <div className="stat-figure text-error">
                                    <i className="fa-solid fa-duotone fa-exclamation-triangle text-3xl"></i>
                                </div>
                                <div className="stat-title">Failed</div>
                                <div className="stat-value text-error">{stats.failed}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={triggerQueueProcessing}
                            className="btn btn-primary"
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-duotone fa-play"></i>
                                    Process Queue Now
                                </>
                            )}
                        </button>

                        <button
                            onClick={loadQueueData}
                            className="btn btn-ghost"
                            disabled={loading}
                        >
                            <i className="fa-solid fa-duotone fa-rotate-right"></i>
                            Refresh
                        </button>
                    </div>

                    <div className="join">
                        <button
                            className={`join-item btn btn-sm ${statusFilter === 'all' ? 'btn-active' : 'btn-ghost'}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`join-item btn btn-sm ${statusFilter === 'pending' ? 'btn-active' : 'btn-ghost'}`}
                            onClick={() => setStatusFilter('pending')}
                        >
                            Pending
                        </button>
                        <button
                            className={`join-item btn btn-sm ${statusFilter === 'sent' ? 'btn-active' : 'btn-ghost'}`}
                            onClick={() => setStatusFilter('sent')}
                        >
                            Sent
                        </button>
                        <button
                            className={`join-item btn btn-sm ${statusFilter === 'failed' ? 'btn-active' : 'btn-ghost'}`}
                            onClick={() => setStatusFilter('failed')}
                        >
                            Failed
                        </button>
                    </div>
                </div>

                {/* Queue Items Table */}
                <div className="card bg-base-200 shadow-md">
                    <div className="card-body">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="loading loading-spinner loading-lg"></div>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-12">
                                <i className="fa-solid fa-duotone fa-inbox text-6xl text-base-content/20 mb-4"></i>
                                <p className="text-base-content/60">No emails in queue</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Recipient</th>
                                            <th>Status</th>
                                            <th>Attempts</th>
                                            <th>Created</th>
                                            <th>Error</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredItems.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <i className="fa-solid fa-duotone fa-envelope text-primary"></i>
                                                        <span className="font-medium">{item.email_type}</span>
                                                    </div>
                                                </td>
                                                <td className="font-mono text-sm">{item.recipient_email}</td>
                                                <td>
                                                    <span className={`badge ${item.status === 'sent' ? 'badge-success' :
                                                        item.status === 'pending' ? 'badge-warning' :
                                                            'badge-error'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={item.attempts >= item.max_attempts ? 'text-error' : ''}>
                                                        {item.attempts} / {item.max_attempts}
                                                    </span>
                                                </td>
                                                <td className="text-sm">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </td>
                                                <td>
                                                    {item.error_message ? (
                                                        <div className="tooltip tooltip-left" data-tip={item.error_message}>
                                                            <i className="fa-solid fa-duotone fa-exclamation-circle text-error cursor-help"></i>
                                                        </div>
                                                    ) : (
                                                        <span className="text-base-content/40">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        {item.status === 'failed' && (
                                                            <button
                                                                onClick={() => retryEmail(item.id)}
                                                                className="btn btn-xs btn-ghost"
                                                                title="Retry"
                                                            >
                                                                <i className="fa-solid fa-duotone fa-rotate-right"></i>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteEmail(item.id)}
                                                            className="btn btn-xs btn-ghost text-error"
                                                            title="Delete"
                                                        >
                                                            <i className="fa-solid fa-duotone fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Box */}
                <div className="alert alert-info mt-6">
                    <i className="fa-solid fa-duotone fa-info-circle"></i>
                    <div>
                        <h3 className="font-bold">About Email Queue</h3>
                        <div className="text-sm">
                            <p>The email queue processor runs automatically every 60 seconds.</p>
                            <p>Failed emails will retry up to 3 times before being marked as permanently failed.</p>
                            <p>Use "Process Queue Now" to trigger immediate processing of pending emails.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
