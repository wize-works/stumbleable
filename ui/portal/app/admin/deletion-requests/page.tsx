'use client';

import { useToaster } from '@/components/toaster';
import { AdminAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DeletionRequest {
    id: string;
    clerk_user_id: string;
    user_email: string;
    requested_at: string;
    scheduled_deletion_at: string;
    status: 'pending' | 'cancelled' | 'completed';
    cancelled_at?: string;
    completed_at?: string;
    cancellation_reason?: string;
    users?: {
        email: string;
        full_name?: string;
        username?: string;
    };
}

export default function AdminDeletionRequestsPage() {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const { showToast } = useToaster();

    const [requests, setRequests] = useState<DeletionRequest[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'cancelled' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        if (isLoaded && user) {
            checkAdminAccess();
        }
    }, [isLoaded, user]);

    useEffect(() => {
        if (isAdmin) {
            loadData();
        }
    }, [isAdmin, statusFilter, searchQuery, currentPage]);

    const checkAdminAccess = async () => {
        try {
            const token = await getToken();
            if (!token) {
                router.push('/sign-in');
                return;
            }

            // Check if user has admin or moderator role
            const roleCheck = await AdminAPI.listDeletionRequests({ limit: 1 }, token);
            setIsAdmin(true);
        } catch (error: any) {
            if (error?.status === 403 || error?.status === 401) {
                showToast('Access denied. Admin role required.', 'error');
                router.push('/dashboard');
            } else {
                console.error('Error checking admin access:', error);
                showToast('Error checking permissions', 'error');
            }
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            // Load requests
            const requestsData = await AdminAPI.listDeletionRequests({
                status: statusFilter === 'all' ? undefined : statusFilter,
                search: searchQuery || undefined,
                limit: pageSize,
                offset: (currentPage - 1) * pageSize,
            }, token);

            setRequests(requestsData.requests);
            setTotalRequests(requestsData.total);

            // Load analytics
            const analyticsData = await AdminAPI.getDeletionAnalytics(token);
            setAnalytics(analyticsData.analytics);
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Error loading deletion requests', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelDeletion = async (requestId: string) => {
        const reason = prompt('Enter reason for cancelling this deletion request:');
        if (!reason) return;

        try {
            const token = await getToken();
            if (!token) return;

            await AdminAPI.cancelDeletionRequest(requestId, reason, token);
            showToast('Deletion request cancelled successfully', 'success');
            loadData();
        } catch (error) {
            console.error('Error cancelling deletion:', error);
            showToast('Error cancelling deletion request', 'error');
        }
    };

    const getDaysRemaining = (scheduledDate: string): number => {
        const now = new Date();
        const scheduled = new Date(scheduledDate);
        const diff = scheduled.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending': return 'badge-warning';
            case 'cancelled': return 'badge-info';
            case 'completed': return 'badge-error';
            default: return 'badge-ghost';
        }
    };

    const getDaysRemainingClass = (days: number) => {
        if (days >= 20) return 'text-success';
        if (days >= 10) return 'text-warning';
        if (days >= 3) return 'text-orange-500';
        return 'text-error';
    };

    if (!isLoaded || isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading loading-spinner loading-xl text-primary"></div>
                    <span className="text-xl">Loading admin dashboard...</span>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const totalPages = Math.ceil(totalRequests / pageSize);

    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                        <i className="fa-solid fa-duotone fa-shield-check text-primary mr-3"></i>
                        Admin Dashboard
                    </h1>
                    <p className="text-lg text-base-content/70">
                        Manage account deletion requests and monitor platform activity
                    </p>
                </div>

                {/* Analytics Cards */}
                {analytics && (
                    <div className="grid md:grid-cols-4 gap-4 mb-8">
                        <div className="card bg-base-200">
                            <div className="card-body">
                                <h3 className="text-sm font-semibold text-base-content/70">Total Requests</h3>
                                <div className="text-3xl font-bold text-base-content">{analytics.total}</div>
                            </div>
                        </div>
                        <div className="card bg-warning/10 border-2 border-warning">
                            <div className="card-body">
                                <h3 className="text-sm font-semibold text-base-content/70">Pending</h3>
                                <div className="text-3xl font-bold text-warning">{analytics.byStatus.pending}</div>
                            </div>
                        </div>
                        <div className="card bg-base-200">
                            <div className="card-body">
                                <h3 className="text-sm font-semibold text-base-content/70">Cancellation Rate</h3>
                                <div className="text-3xl font-bold text-info">{analytics.cancellationRate}%</div>
                            </div>
                        </div>
                        <div className="card bg-base-200">
                            <div className="card-body">
                                <h3 className="text-sm font-semibold text-base-content/70">Avg Days to Cancel</h3>
                                <div className="text-3xl font-bold text-base-content">{analytics.avgDaysToCancellation}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="card bg-base-200 mb-6">
                    <div className="card-body">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">
                                    <span className="label-text font-semibold">Status Filter</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value as any);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">
                                    <span className="label-text font-semibold">Search</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search by email or user ID..."
                                    className="input input-bordered w-full"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="card bg-base-200">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">
                            Deletion Requests
                            <span className="badge badge-lg">{totalRequests}</span>
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Requested</th>
                                        <th>Scheduled</th>
                                        <th>Days Remaining</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((request) => {
                                        const daysRemaining = getDaysRemaining(request.scheduled_deletion_at);
                                        return (
                                            <tr key={request.id}>
                                                <td>
                                                    <div>
                                                        <div className="font-semibold">{request.user_email}</div>
                                                        {request.users?.full_name && (
                                                            <div className="text-sm text-base-content/60">
                                                                {request.users.full_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-sm">
                                                    {new Date(request.requested_at).toLocaleDateString()}
                                                </td>
                                                <td className="text-sm">
                                                    {new Date(request.scheduled_deletion_at).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    {request.status === 'pending' && (
                                                        <span className={`font-semibold ${getDaysRemainingClass(daysRemaining)}`}>
                                                            {daysRemaining} days
                                                        </span>
                                                    )}
                                                    {request.status !== 'pending' && (
                                                        <span className="text-base-content/60">N/A</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => router.push(`/admin/deletion-requests/${request.id}`)}
                                                            className="btn btn-ghost btn-xs"
                                                            title="View Details"
                                                        >
                                                            <i className="fa-solid fa-eye"></i>
                                                        </button>
                                                        {request.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleCancelDeletion(request.id)}
                                                                className="btn btn-error btn-xs"
                                                                title="Cancel Deletion"
                                                            >
                                                                <i className="fa-solid fa-ban"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {requests.length === 0 && (
                                <div className="text-center py-12">
                                    <i className="fa-solid fa-duotone fa-inbox text-6xl text-base-content/30 mb-4"></i>
                                    <p className="text-xl text-base-content/60">No deletion requests found</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button
                                    className="btn btn-sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                >
                                    Previous
                                </button>
                                <span className="flex items-center px-4">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="btn btn-sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
