'use client';

import { useToaster } from '@/components/toaster';
import { AdminAPI, InteractionAPI, ModerationAPI, UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface AnalyticsData {
    // User Analytics
    users: {
        total: number;
        active7Days: number;
        active30Days: number;
        newToday: number;
        new7Days: number;
        new30Days: number;
        byRole: {
            user: number;
            moderator: number;
            admin: number;
        };
        growthRate: number;
    };
    // Content Analytics
    content: {
        totalDiscoveries: number;
        totalInteractions: number;
        byAction: Record<string, number>;
        topDomains: Array<{ domain: string; count: number }>;
        avgEngagementRate: number;
    };
    // Moderation Analytics
    moderation: {
        totalPending: number;
        totalReviewed: number;
        totalApproved: number;
        totalRejected: number;
        avgReviewTime: number | null;
        totalReports: number;
        approvalRate: number;
    };
    // System Analytics
    system: {
        deletionRequests: {
            total: number;
            pending: number;
            completed: number;
            cancelled: number;
        };
    };
}

export default function AnalyticsDashboard() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const { showToast } = useToaster();

    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
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

    const isAdmin = userRole === 'admin';

    useEffect(() => {
        if (!isAdmin || checkingRole) return;
        fetchAnalytics();
    }, [isAdmin, checkingRole, timeRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            // Fetch all analytics data in parallel
            const [userAnalytics, moderationAnalytics, deletionAnalytics, interactionSummary] = await Promise.all([
                UserAPI.getUserAnalytics(token),
                ModerationAPI.getModerationAnalytics(token),
                AdminAPI.getDeletionAnalytics(token),
                InteractionAPI.getAnalyticsSummary(token).catch(() => ({ totalInteractions: 0, byAction: {}, savedCount: 0 })),
            ]);

            const userStats = userAnalytics.analytics;
            const modStats = moderationAnalytics.analytics;
            const deletionStats = deletionAnalytics.analytics;

            // Calculate growth rate
            const growthRate = userStats.newUsers30Days > 0
                ? Math.round((userStats.newUsers30Days / (userStats.totalUsers - userStats.newUsers30Days)) * 100)
                : 0;

            // Calculate approval rate
            const totalReviewed = modStats.totalApproved + modStats.totalRejected;
            const approvalRate = totalReviewed > 0
                ? Math.round((modStats.totalApproved / totalReviewed) * 100)
                : 0;

            // Calculate average engagement rate
            const avgEngagementRate = userStats.activeUsers30Days > 0
                ? Math.round((interactionSummary.totalInteractions / userStats.activeUsers30Days))
                : 0;

            const analyticsData: AnalyticsData = {
                users: {
                    total: userStats.totalUsers,
                    active7Days: userStats.activeUsers7Days,
                    active30Days: userStats.activeUsers30Days,
                    newToday: userStats.newUsersToday,
                    new7Days: userStats.newUsers7Days,
                    new30Days: userStats.newUsers30Days,
                    byRole: userStats.usersByRole,
                    growthRate,
                },
                content: {
                    totalDiscoveries: 0, // TODO: Implement
                    totalInteractions: interactionSummary.totalInteractions,
                    byAction: interactionSummary.byAction,
                    topDomains: [], // TODO: Implement
                    avgEngagementRate,
                },
                moderation: {
                    totalPending: modStats.totalPending,
                    totalReviewed: modStats.totalReviewed,
                    totalApproved: modStats.totalApproved,
                    totalRejected: modStats.totalRejected,
                    avgReviewTime: modStats.avgReviewTime,
                    totalReports: modStats.totalReports,
                    approvalRate,
                },
                system: {
                    deletionRequests: {
                        total: deletionStats.total,
                        pending: deletionStats.byStatus.pending,
                        completed: deletionStats.byStatus.completed,
                        cancelled: deletionStats.byStatus.cancelled,
                    },
                },
            };

            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setError('Failed to load analytics data');
            showToast('Failed to load analytics', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (checkingRole) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-base-content mb-4">Access Denied</h1>
                <p className="text-base-content/70">This page is restricted to administrators only.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-error mb-4">Error</h1>
                <p className="text-base-content/70 mb-4">{error}</p>
                <button onClick={fetchAnalytics} className="btn btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    if (!analytics) {
        return null;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-base-content mb-2">
                        <i className="fa-solid fa-duotone fa-chart-line text-primary mr-3"></i>
                        Analytics Dashboard
                    </h1>
                    <p className="text-base-content/70">
                        Comprehensive platform insights and metrics
                    </p>
                </div>

                {/* Time Range Selector */}
                <div className="join">
                    <button
                        className={`join-item btn btn-sm ${timeRange === '7d' ? 'btn-active' : ''}`}
                        onClick={() => setTimeRange('7d')}
                    >
                        7 Days
                    </button>
                    <button
                        className={`join-item btn btn-sm ${timeRange === '30d' ? 'btn-active' : ''}`}
                        onClick={() => setTimeRange('30d')}
                    >
                        30 Days
                    </button>
                    <button
                        className={`join-item btn btn-sm ${timeRange === '90d' ? 'btn-active' : ''}`}
                        onClick={() => setTimeRange('90d')}
                    >
                        90 Days
                    </button>
                </div>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <div className="stats bg-base-200 shadow">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <i className="fa-solid fa-duotone fa-users text-4xl"></i>
                        </div>
                        <div className="stat-title">Total Users</div>
                        <div className="stat-value text-primary">{analytics.users.total.toLocaleString()}</div>
                        <div className="stat-desc">
                            {analytics.users.new30Days} new this month (+{analytics.users.growthRate}%)
                        </div>
                    </div>
                </div>

                {/* Active Users */}
                <div className="stats bg-base-200 shadow">
                    <div className="stat">
                        <div className="stat-figure text-success">
                            <i className="fa-solid fa-duotone fa-user-check text-4xl"></i>
                        </div>
                        <div className="stat-title">Active Users</div>
                        <div className="stat-value text-success">{analytics.users.active30Days.toLocaleString()}</div>
                        <div className="stat-desc">
                            {analytics.users.active7Days} active this week
                        </div>
                    </div>
                </div>

                {/* Total Interactions */}
                <div className="stats bg-base-200 shadow">
                    <div className="stat">
                        <div className="stat-figure text-info">
                            <i className="fa-solid fa-duotone fa-hand-pointer text-4xl"></i>
                        </div>
                        <div className="stat-title">Total Interactions</div>
                        <div className="stat-value text-info">{analytics.content.totalInteractions.toLocaleString()}</div>
                        <div className="stat-desc">
                            Avg {analytics.content.avgEngagementRate} per active user
                        </div>
                    </div>
                </div>

                {/* Approval Rate */}
                <div className="stats bg-base-200 shadow">
                    <div className="stat">
                        <div className="stat-figure text-warning">
                            <i className="fa-solid fa-duotone fa-shield-check text-4xl"></i>
                        </div>
                        <div className="stat-title">Approval Rate</div>
                        <div className="stat-value text-warning">{analytics.moderation.approvalRate}%</div>
                        <div className="stat-desc">
                            {analytics.moderation.totalReviewed} items reviewed
                        </div>
                    </div>
                </div>
            </div>

            {/* User Analytics */}
            <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">
                        <i className="fa-solid fa-duotone fa-users text-primary"></i>
                        User Growth & Engagement
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* New Users Trend */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">New User Registrations</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                                    <span className="text-sm font-medium">Today</span>
                                    <span className="badge badge-lg badge-primary">{analytics.users.newToday}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                                    <span className="text-sm font-medium">Last 7 Days</span>
                                    <span className="badge badge-lg badge-info">{analytics.users.new7Days}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                                    <span className="text-sm font-medium">Last 30 Days</span>
                                    <span className="badge badge-lg badge-success">{analytics.users.new30Days}</span>
                                </div>
                            </div>
                        </div>

                        {/* User Roles Distribution */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Users by Role</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-user text-base-content"></i>
                                        <span className="text-sm font-medium">Users</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold">{analytics.users.byRole.user}</span>
                                        <span className="text-xs text-base-content/60">
                                            ({Math.round((analytics.users.byRole.user / analytics.users.total) * 100)}%)
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-shield text-warning"></i>
                                        <span className="text-sm font-medium">Moderators</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-warning">{analytics.users.byRole.moderator}</span>
                                        <span className="text-xs text-base-content/60">
                                            ({Math.round((analytics.users.byRole.moderator / analytics.users.total) * 100)}%)
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-crown text-error"></i>
                                        <span className="text-sm font-medium">Admins</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-error">{analytics.users.byRole.admin}</span>
                                        <span className="text-xs text-base-content/60">
                                            ({Math.round((analytics.users.byRole.admin / analytics.users.total) * 100)}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content & Interaction Analytics */}
            <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">
                        <i className="fa-solid fa-duotone fa-chart-bar text-info"></i>
                        Content & Interactions
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(analytics.content.byAction).map(([action, count]) => (
                            <div key={action} className="stats bg-base-100 shadow">
                                <div className="stat">
                                    <div className="stat-title capitalize">{action}</div>
                                    <div className="stat-value text-2xl">{count.toLocaleString()}</div>
                                    <div className="stat-desc">
                                        {Math.round((count / analytics.content.totalInteractions) * 100)}% of total
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Moderation Analytics */}
            <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">
                        <i className="fa-solid fa-duotone fa-gavel text-warning"></i>
                        Moderation Performance
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="stats bg-base-100 shadow">
                            <div className="stat">
                                <div className="stat-title">Pending Review</div>
                                <div className="stat-value text-warning">{analytics.moderation.totalPending}</div>
                                <div className="stat-desc">Awaiting moderation</div>
                            </div>
                        </div>
                        <div className="stats bg-base-100 shadow">
                            <div className="stat">
                                <div className="stat-title">Approved</div>
                                <div className="stat-value text-success">{analytics.moderation.totalApproved}</div>
                                <div className="stat-desc">{analytics.moderation.approvalRate}% approval rate</div>
                            </div>
                        </div>
                        <div className="stats bg-base-100 shadow">
                            <div className="stat">
                                <div className="stat-title">Rejected</div>
                                <div className="stat-value text-error">{analytics.moderation.totalRejected}</div>
                                <div className="stat-desc">{100 - analytics.moderation.approvalRate}% rejection rate</div>
                            </div>
                        </div>
                        <div className="stats bg-base-100 shadow">
                            <div className="stat">
                                <div className="stat-title">Avg Review Time</div>
                                <div className="stat-value text-info">
                                    {analytics.moderation.avgReviewTime
                                        ? `${Math.round(analytics.moderation.avgReviewTime)}m`
                                        : 'N/A'}
                                </div>
                                <div className="stat-desc">Per item</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-base-100 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Content Reports</h3>
                                <p className="text-sm text-base-content/70">User-flagged content issues</p>
                            </div>
                            <div className="text-3xl font-bold text-error">{analytics.moderation.totalReports}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Health */}
            <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">
                        <i className="fa-solid fa-duotone fa-server text-success"></i>
                        System Health
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="stats bg-base-100 shadow">
                            <div className="stat">
                                <div className="stat-title">Total Deletion Requests</div>
                                <div className="stat-value">{analytics.system.deletionRequests.total}</div>
                            </div>
                        </div>
                        <div className="stats bg-base-100 shadow">
                            <div className="stat">
                                <div className="stat-title">Pending</div>
                                <div className="stat-value text-warning">{analytics.system.deletionRequests.pending}</div>
                            </div>
                        </div>
                        <div className="stats bg-base-100 shadow">
                            <div className="stat">
                                <div className="stat-title">Completed</div>
                                <div className="stat-value text-success">{analytics.system.deletionRequests.completed}</div>
                            </div>
                        </div>
                        <div className="stats bg-base-100 shadow">
                            <div className="stat">
                                <div className="stat-title">Cancelled</div>
                                <div className="stat-value text-info">{analytics.system.deletionRequests.cancelled}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
