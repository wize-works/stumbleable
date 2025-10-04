'use client';

import { useToaster } from '@/components/toaster';
import { AdminAPI, InteractionAPI, ModerationAPI, UserAPI } from '@/lib/api-client';
import { CHART_COLORS } from '@/lib/chart-colors';
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
    const [initialLoad, setInitialLoad] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [userRole, setUserRole] = useState<'user' | 'moderator' | 'admin' | null>(null);
    const [checkingRole, setCheckingRole] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [refreshing, setRefreshing] = useState(false);

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

        // Auto-refresh every 60 seconds for real-time data
        const refreshInterval = setInterval(() => {
            fetchAnalytics();
        }, 60000);

        return () => clearInterval(refreshInterval);
    }, [isAdmin, checkingRole, timeRange]);

    const fetchAnalytics = async (isManualRefresh = false) => {
        try {
            // Only show full loading spinner on initial load
            if (!analytics) {
                setInitialLoad(true);
            }
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
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setError('Failed to load analytics data');
            if (!analytics) {
                showToast('Failed to load analytics', 'error');
            }
        } finally {
            setInitialLoad(false);
            setRefreshing(false);
        }
    };

    const handleManualRefresh = async () => {
        if (refreshing) return; // Prevent multiple simultaneous refreshes
        setRefreshing(true);
        try {
            await fetchAnalytics(true);
            showToast('Analytics refreshed', 'success');
        } catch (error) {
            // Error already handled in fetchAnalytics
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

    if (initialLoad) {
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
                <button onClick={() => fetchAnalytics()} className="btn btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    if (!analytics) {
        return null;
    }

    return (
        <div className="space-y-8 relative">
            {/* Subtle loading overlay during refresh */}
            {refreshing && (
                <div className="absolute top-0 right-0 z-10">
                    <div className="alert alert-info shadow-lg animate-pulse">
                        <i className="fa-solid fa-duotone fa-rotate fa-spin"></i>
                        <span className="text-sm">Refreshing data...</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-base-content mb-2">
                        <i className="fa-solid fa-duotone fa-chart-line text-primary mr-3"></i>
                        Analytics Dashboard
                        {refreshing && <span className="loading loading-spinner loading-sm ml-3 text-primary"></span>}
                    </h1>
                    <p className="text-base-content/70">
                        Comprehensive platform insights and metrics
                    </p>
                    {lastUpdated && (
                        <p className="text-xs text-base-content/50 mt-1">
                            Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 60s
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Refresh Button */}
                    <button
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className="btn btn-sm btn-ghost"
                        title="Refresh data"
                    >
                        <i className={`fa-solid fa-duotone fa-rotate ${refreshing ? 'fa-spin' : ''}`}></i>
                        Refresh
                    </button>

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
            </div>

            {/* Main content area with smooth transition during refresh */}
            <div className={`transition-opacity duration-300 ${refreshing ? 'opacity-75' : 'opacity-100'}`}>
                {/* Key Metrics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                            {/* New Users Trend Chart */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">New User Registrations</h3>
                                <div className="bg-base-100 rounded-lg p-4">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <AreaChart data={[
                                            { period: 'Today', users: analytics.users.newToday },
                                            { period: '7 Days', users: analytics.users.new7Days },
                                            { period: '30 Days', users: analytics.users.new30Days },
                                        ]}>
                                            <defs>
                                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                            <XAxis dataKey="period" stroke="hsl(var(--bc))" />
                                            <YAxis stroke="hsl(var(--bc))" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-base-100)',
                                                    border: '1px solid var(--color-base-content)',
                                                    borderRadius: '0.5rem'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="users"
                                                stroke={CHART_COLORS.primary}
                                                fillOpacity={1}
                                                fill="url(#colorUsers)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* User Roles Distribution Pie Chart */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Users by Role</h3>
                                <div className="bg-base-100 rounded-lg p-4">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Users', value: analytics.users.byRole.user },
                                                    { name: 'Moderators', value: analytics.users.byRole.moderator },
                                                    { name: 'Admins', value: analytics.users.byRole.admin },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill={CHART_COLORS.primary}
                                                dataKey="value"
                                            >
                                                <Cell fill={CHART_COLORS.primary} />
                                                <Cell fill={CHART_COLORS.warning} />
                                                <Cell fill={CHART_COLORS.error} />
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-base-100)',
                                                    border: '1px solid var(--color-base-content)',
                                                    borderRadius: '0.5rem'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
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

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Interaction Types Distribution</h3>
                            <div className="bg-base-100 rounded-lg p-4">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={Object.entries(analytics.content.byAction).map(([action, count]) => ({
                                        action: action.charAt(0).toUpperCase() + action.slice(1),
                                        count,
                                        percentage: Math.round((count / analytics.content.totalInteractions) * 100)
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="action" stroke="hsl(var(--bc))" />
                                        <YAxis stroke="hsl(var(--bc))" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--b1))',
                                                border: '1px solid hsl(var(--bc) / 0.2)',
                                                borderRadius: '0.5rem'
                                            }}
                                            formatter={(value: any, name: string) => {
                                                if (name === 'count') return [value.toLocaleString(), 'Interactions'];
                                                return [value + '%', 'Percentage'];
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="count" fill={CHART_COLORS.info} radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

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

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Moderation Status Overview</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Pie Chart */}
                                <div className="bg-base-100 rounded-lg p-4">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Approved', value: analytics.moderation.totalApproved },
                                                    { name: 'Rejected', value: analytics.moderation.totalRejected },
                                                    { name: 'Pending', value: analytics.moderation.totalPending },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry: any) => `${entry.name}: ${entry.value}`}
                                                outerRadius={80}
                                                fill={CHART_COLORS.success}
                                                dataKey="value"
                                            >
                                                <Cell fill={CHART_COLORS.success} />
                                                <Cell fill={CHART_COLORS.error} />
                                                <Cell fill={CHART_COLORS.warning} />
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--b1))',
                                                    border: '1px solid hsl(var(--bc) / 0.2)',
                                                    borderRadius: '0.5rem'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Line Chart for Review Efficiency */}
                                <div className="bg-base-100 rounded-lg p-4">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={[
                                            { status: 'Pending', count: analytics.moderation.totalPending },
                                            { status: 'Approved', count: analytics.moderation.totalApproved },
                                            { status: 'Rejected', count: analytics.moderation.totalRejected },
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                            <XAxis dataKey="status" stroke="hsl(var(--bc))" />
                                            <YAxis stroke="hsl(var(--bc))" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--b1))',
                                                    border: '1px solid hsl(var(--bc) / 0.2)',
                                                    borderRadius: '0.5rem'
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="count"
                                                stroke={CHART_COLORS.warning}
                                                strokeWidth={2}
                                                dot={{ fill: CHART_COLORS.warning, r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

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

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Deletion Requests Status</h3>
                            <div className="bg-base-100 rounded-lg p-4">
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={[
                                        { status: 'Pending', count: analytics.system.deletionRequests.pending, color: CHART_COLORS.warning },
                                        { status: 'Completed', count: analytics.system.deletionRequests.completed, color: CHART_COLORS.success },
                                        { status: 'Cancelled', count: analytics.system.deletionRequests.cancelled, color: CHART_COLORS.info },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="status" stroke="hsl(var(--bc))" />
                                        <YAxis stroke="hsl(var(--bc))" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--b1))',
                                                border: '1px solid hsl(var(--bc) / 0.2)',
                                                borderRadius: '0.5rem'
                                            }}
                                        />
                                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                            <Cell fill={CHART_COLORS.warning} />
                                            <Cell fill={CHART_COLORS.success} />
                                            <Cell fill={CHART_COLORS.info} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

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
            </div> {/* Close transition wrapper */}
        </div>
    );
}
