'use client';

import { useToaster } from '@/components/toaster';
import { AdminAPI, ModerationAPI, UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AdminStats {
    totalUsers: number;
    totalDiscoveries: number;
    totalSubmissions: number;
    pendingModeration: number;
    pendingDeletionRequests: number;
    totalReports: number;
    activeUsers7Days: number;
    activeUsers30Days: number;
    newUsersToday?: number;
    newUsers7Days?: number;
    newUsers30Days?: number;
    usersByRole?: {
        user: number;
        moderator: number;
        admin: number;
    };
}

interface RecentActivity {
    id: string;
    type: 'user_registered' | 'content_flagged' | 'deletion_requested' | 'content_approved';
    message: string;
    timestamp: string;
    link?: string;
}

export default function AdminDashboard() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const { showToast } = useToaster();

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<'user' | 'moderator' | 'admin' | null>(null);
    const [checkingRole, setCheckingRole] = useState(true);

    // Check user role
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

    // Check if user has admin role
    const isAdmin = userRole === 'admin';

    useEffect(() => {
        if (!isAdmin || checkingRole) return;

        fetchAdminData();
    }, [isAdmin, checkingRole]);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            // Fetch admin statistics from various services
            const [deletionRequestsData, moderationAnalytics, userAnalytics] = await Promise.all([
                AdminAPI.listDeletionRequests({ status: 'pending', limit: 1 }, token),
                ModerationAPI.getModerationAnalytics(token),
                UserAPI.getUserAnalytics(token),
            ]);

            // Aggregate stats from the actual API response structure
            const modStats = moderationAnalytics.analytics;
            const userStats = userAnalytics.analytics;
            const aggregatedStats: AdminStats = {
                totalUsers: userStats.totalUsers,
                totalDiscoveries: 0, // TODO: Add discovery stats endpoint
                totalSubmissions: 0, // TODO: Add submission stats endpoint
                pendingModeration: modStats.totalPending || 0,
                pendingDeletionRequests: deletionRequestsData.total || 0,
                totalReports: modStats.totalReports || 0,
                activeUsers7Days: userStats.activeUsers7Days,
                activeUsers30Days: userStats.activeUsers30Days,
                newUsersToday: userStats.newUsersToday,
                newUsers7Days: userStats.newUsers7Days,
                newUsers30Days: userStats.newUsers30Days,
                usersByRole: userStats.usersByRole,
            };

            setStats(aggregatedStats);

            // TODO: Fetch recent activity from activity log API
            setRecentActivity([]);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            setError('Failed to load admin dashboard data');
            showToast('Failed to load admin data', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (checkingRole) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-base-content mb-4">Access Denied</h1>
                    <p className="text-base-content/70">This page is restricted to administrators only.</p>
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
                    <button onClick={fetchAdminData} className="btn btn-primary">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-base-content mb-2">Admin Dashboard</h1>
                    <p className="text-base-content/70">
                        Platform overview and administrative controls
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Pending Moderation */}
                    <div className="card bg-warning/10 shadow-md border border-warning/20">
                        <div className="card-body">
                            <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                                Pending Moderation
                            </h3>
                            <p className="text-3xl font-bold text-warning">
                                {stats?.pendingModeration ?? 0}
                            </p>
                            <Link href="/admin/moderation" className="text-xs text-warning hover:underline mt-2">
                                View Queue →
                            </Link>
                        </div>
                    </div>

                    {/* Deletion Requests */}
                    <div className="card bg-error/10 shadow-md border border-error/20">
                        <div className="card-body">
                            <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                                Deletion Requests
                            </h3>
                            <p className="text-3xl font-bold text-error">
                                {stats?.pendingDeletionRequests ?? 0}
                            </p>
                            <Link href="/admin/deletion-requests" className="text-xs text-error hover:underline mt-2">
                                Manage Requests →
                            </Link>
                        </div>
                    </div>

                    {/* Content Reports */}
                    <div className="card bg-info/10 shadow-md border border-info/20">
                        <div className="card-body">
                            <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                                Content Reports
                            </h3>
                            <p className="text-3xl font-bold text-info">
                                {stats?.totalReports ?? 0}
                            </p>
                            <Link href="/admin/moderation?tab=reports" className="text-xs text-info hover:underline mt-2">
                                Review Reports →
                            </Link>
                        </div>
                    </div>

                    {/* Total Users */}
                    <div className="card bg-success/10 shadow-md border border-success/20">
                        <div className="card-body">
                            <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                                Total Users
                            </h3>
                            <p className="text-3xl font-bold text-success">
                                {stats?.totalUsers ?? '—'}
                            </p>
                            <div className="text-xs text-base-content/60 mt-2">
                                Platform registered users
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Analytics Section */}
                <div className="card bg-base-200 shadow-md mb-8">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-6">
                            <i className="fa-solid fa-duotone fa-users text-primary"></i>
                            User Analytics
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* New Users */}
                            <div className="stat bg-base-100 rounded-lg p-4">
                                <div className="stat-title text-sm">New Users</div>
                                <div className="stat-value text-2xl text-primary">
                                    {stats?.newUsers7Days ?? 0}
                                </div>
                                <div className="stat-desc text-xs mt-1">
                                    Last 7 days ({stats?.newUsersToday ?? 0} today)
                                </div>
                            </div>

                            {/* Active Users */}
                            <div className="stat bg-base-100 rounded-lg p-4">
                                <div className="stat-title text-sm">Active Users</div>
                                <div className="stat-value text-2xl text-success">
                                    {stats?.activeUsers7Days ?? '—'}
                                </div>
                                <div className="stat-desc text-xs mt-1">
                                    Last 7 days ({stats?.activeUsers30Days ?? 0} in 30d)
                                </div>
                            </div>

                            {/* Growth Rate */}
                            <div className="stat bg-base-100 rounded-lg p-4">
                                <div className="stat-title text-sm">30-Day Growth</div>
                                <div className="stat-value text-2xl text-info">
                                    {stats?.newUsers30Days ?? 0}
                                </div>
                                <div className="stat-desc text-xs mt-1">
                                    New registrations
                                </div>
                            </div>
                        </div>

                        {/* Users by Role */}
                        {stats?.usersByRole && (
                            <div>
                                <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide mb-3">
                                    Users by Role
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-base-100 rounded-lg p-3 text-center">
                                        <div className="text-xs text-base-content/60 mb-1">Users</div>
                                        <div className="text-xl font-bold">{stats.usersByRole.user}</div>
                                    </div>
                                    <div className="bg-base-100 rounded-lg p-3 text-center">
                                        <div className="text-xs text-base-content/60 mb-1">Moderators</div>
                                        <div className="text-xl font-bold text-warning">{stats.usersByRole.moderator}</div>
                                    </div>
                                    <div className="bg-base-100 rounded-lg p-3 text-center">
                                        <div className="text-xs text-base-content/60 mb-1">Admins</div>
                                        <div className="text-xl font-bold text-error">{stats.usersByRole.admin}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Admin Tools */}
                    <div className="card bg-base-200 shadow-md">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4">
                                <i className="fa-solid fa-duotone fa-tools text-primary"></i>
                                Admin Tools
                            </h2>
                            <div className="space-y-3">
                                <Link
                                    href="/admin/moderation"
                                    className="btn btn-block btn-outline justify-start"
                                >
                                    <i className="fa-solid fa-duotone fa-flag text-warning"></i>
                                    Content Moderation
                                </Link>
                                <Link
                                    href="/admin/deletion-requests"
                                    className="btn btn-block btn-outline justify-start"
                                >
                                    <i className="fa-solid fa-duotone fa-user-slash text-error"></i>
                                    Deletion Requests
                                </Link>
                                <button
                                    className="btn btn-block btn-outline justify-start"
                                    disabled
                                    title="Coming soon"
                                >
                                    <i className="fa-solid fa-duotone fa-chart-line text-info"></i>
                                    Analytics Dashboard
                                    <span className="badge badge-sm">Soon</span>
                                </button>
                                <button
                                    className="btn btn-block btn-outline justify-start"
                                    disabled
                                    title="Coming soon"
                                >
                                    <i className="fa-solid fa-duotone fa-users text-primary"></i>
                                    User Management
                                    <span className="badge badge-sm">Soon</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="card bg-base-200 shadow-md">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4">
                                <i className="fa-solid fa-duotone fa-server text-success"></i>
                                System Status
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                                    <span className="text-sm font-medium">Discovery Service</span>
                                    <span className="badge badge-success badge-sm">Online</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                                    <span className="text-sm font-medium">User Service</span>
                                    <span className="badge badge-success badge-sm">Online</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                                    <span className="text-sm font-medium">Moderation Service</span>
                                    <span className="badge badge-success badge-sm">Online</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                                    <span className="text-sm font-medium">Crawler Service</span>
                                    <span className="badge badge-success badge-sm">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity - Placeholder */}
                <div className="card bg-base-200 shadow-md">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">
                            <i className="fa-solid fa-duotone fa-clock-rotate-left text-info"></i>
                            Recent Activity
                        </h2>
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-base-content/60">
                                <i className="fa-solid fa-duotone fa-inbox text-4xl mb-4 opacity-50"></i>
                                <p>No recent activity to display</p>
                                <p className="text-sm mt-2">Activity logging coming soon</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {recentActivity.map(activity => (
                                    <div
                                        key={activity.id}
                                        className="p-3 bg-base-100 rounded flex items-start justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{activity.message}</p>
                                            <p className="text-xs text-base-content/60 mt-1">
                                                {new Date(activity.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        {activity.link && (
                                            <Link href={activity.link} className="btn btn-xs btn-ghost">
                                                View
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
