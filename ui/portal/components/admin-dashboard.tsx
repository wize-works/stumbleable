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

interface ServiceStatus {
    name: string;
    status: 'online' | 'offline' | 'unknown';
    responseTime?: number;
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
    const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);

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
        checkServiceHealth();

        // Refresh service health every 30 seconds
        const healthCheckInterval = setInterval(checkServiceHealth, 30000);
        return () => clearInterval(healthCheckInterval);
    }, [isAdmin, checkingRole]);

    const checkServiceHealth = async () => {
        const services = [
            { name: 'Discovery Service', url: process.env.NEXT_PUBLIC_DISCOVERY_API_URL || 'http://localhost:7001' },
            { name: 'User Service', url: process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:7003' },
            { name: 'Interaction Service', url: process.env.NEXT_PUBLIC_INTERACTION_API_URL || 'http://localhost:7002' },
            { name: 'Moderation Service', url: process.env.NEXT_PUBLIC_MODERATION_API_URL || 'http://localhost:7005' },
            { name: 'Crawler Service', url: process.env.NEXT_PUBLIC_CRAWLER_API_URL || 'http://localhost:7004' },
        ];

        const statuses: ServiceStatus[] = await Promise.all(
            services.map(async (service) => {
                try {
                    const start = Date.now();
                    const response = await fetch(`${service.url}/health`, {
                        method: 'GET',
                        signal: AbortSignal.timeout(5000), // 5 second timeout
                    });
                    const responseTime = Date.now() - start;

                    return {
                        name: service.name,
                        status: response.ok ? 'online' : 'offline',
                        responseTime,
                    } as ServiceStatus;
                } catch (error) {
                    return {
                        name: service.name,
                        status: 'offline',
                    } as ServiceStatus;
                }
            })
        );

        setServiceStatuses(statuses);
    };

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

            // Fetch recent activity from multiple sources
            await fetchRecentActivity(token);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            setError('Failed to load admin dashboard data');
            showToast('Failed to load admin data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentActivity = async (token: string) => {
        try {
            // Fetch data from multiple sources in parallel
            const [recentUsers, recentReports, recentDeletionRequests, moderationQueue] = await Promise.all([
                UserAPI.getRecentUsers(7, token).catch(() => ({ users: [] })),
                ModerationAPI.listContentReports({ status: 'pending', limit: 10 }, token).catch(() => ({ reports: [] })),
                AdminAPI.listDeletionRequests({ status: 'pending', limit: 10 }, token).catch(() => ({ requests: [] })),
                ModerationAPI.listModerationQueue({ status: 'approved', limit: 10 }, token).catch(() => ({ items: [] })),
            ]);

            const activities: RecentActivity[] = [];

            // Add new user registrations
            if (recentUsers.users) {
                recentUsers.users.slice(0, 5).forEach((user: any) => {
                    activities.push({
                        id: `user-${user.id}`,
                        type: 'user_registered',
                        message: `New user registered: ${user.full_name || user.email}`,
                        timestamp: user.created_at,
                        link: undefined,
                    });
                });
            }

            // Add content reports
            if (recentReports.reports) {
                recentReports.reports.slice(0, 5).forEach((report: any) => {
                    activities.push({
                        id: `report-${report.id}`,
                        type: 'content_flagged',
                        message: `Content reported: ${report.content?.title || 'Untitled'} (${report.reason})`,
                        timestamp: report.created_at,
                        link: `/admin/moderation?tab=reports`,
                    });
                });
            }

            // Add deletion requests
            if (recentDeletionRequests.requests) {
                recentDeletionRequests.requests.slice(0, 5).forEach((request: any) => {
                    activities.push({
                        id: `deletion-${request.id}`,
                        type: 'deletion_requested',
                        message: `Account deletion requested by ${request.user_email}`,
                        timestamp: request.requested_at,
                        link: `/admin/deletion-requests`,
                    });
                });
            }

            // Add moderation queue items
            if (moderationQueue.items) {
                moderationQueue.items.slice(0, 3).forEach((item: any) => {
                    if (item.moderated_at) {
                        activities.push({
                            id: `mod-${item.id}`,
                            type: 'content_approved',
                            message: `Content ${item.status === 'approved' ? 'approved' : 'rejected'}: ${item.title || 'Untitled'}`,
                            timestamp: item.moderated_at,
                            link: `/admin/moderation`,
                        });
                    }
                });
            }

            // Sort by timestamp (most recent first) and take top 20
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setRecentActivity(activities.slice(0, 20));
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            // Don't fail the whole dashboard if activity fetch fails
            setRecentActivity([]);
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
                    <div className="stats bg-warning/10 shadow-md border border-warning/20">
                        <div className="stat">
                            <div className="stat-figure text-warning">
                                <i className="fa-solid fa-duotone fa-gavel text-4xl"></i>
                            </div>
                            <h3 className="stat-title font-semibold text-base-content/70 uppercase tracking-wide">
                                Pending Moderation
                            </h3>
                            <div className="stat-value text-warning">
                                {stats?.pendingModeration ?? 0}
                            </div>
                            <div className='stat-actions'>
                                <Link href="/admin/moderation" className="btn btn-warning btn-sm">
                                    View Queue →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Deletion Requests */}
                    <div className="stats bg-error/10 shadow-md border border-error/20">
                        <div className="stat">
                            <div className="stat-figure text-error">
                                <i className="fa-solid fa-duotone fa-user-slash text-4xl"></i>
                            </div>
                            <h3 className="stat-title font-semibold text-base-content/70 uppercase tracking-wide">
                                Deletion Requests
                            </h3>
                            <div className="stat-value text-error">
                                {stats?.pendingDeletionRequests ?? 0}
                            </div>
                            <div className='stat-actions'>
                                <Link href="/admin/deletion-requests" className="btn btn-error btn-sm">
                                    Manage Requests →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Content Reports */}
                    <div className="stats bg-info/10 shadow-md border border-info/20">
                        <div className="stat">
                            <div className="stat-figure text-info">
                                <i className="fa-solid fa-duotone fa-flag text-4xl"></i>
                            </div>
                            <h3 className="stat-title font-semibold text-base-content/70 uppercase tracking-wide">
                                Content Reports
                            </h3>
                            <div className="stat-value text-info">
                                {stats?.totalReports ?? 0}
                            </div>
                            <div className='stat-actions'>
                                <Link href="/admin/moderation?tab=reports" className="btn btn-info btn-sm">
                                    Review Reports →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Total Users */}
                    <div className="stats bg-success/10 shadow-md border border-success/20">
                        <div className="stat">
                            <div className="stat-figure text-success">
                                <i className="fa-solid fa-duotone fa-users text-4xl"></i>
                            </div>
                            <h3 className="stat-title font-semibold text-base-content/70 uppercase tracking-wide">
                                Total Users
                            </h3>
                            <div className="stat-value text-success">
                                {stats?.totalUsers ?? '—'}
                            </div>
                            <div className="stat-desc text-base-content/60">
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
                            <div className="stats bg-base-100 shadow">
                                <div className="stat">
                                    <div className="stat-figure text-primary">
                                        <i className="fa-solid fa-duotone fa-user-plus text-3xl"></i>
                                    </div>
                                    <div className="stat-title">New Users</div>
                                    <div className="stat-value text-primary">
                                        {stats?.newUsers7Days ?? 0}
                                    </div>
                                    <div className="stat-desc">
                                        Last 7 days ({stats?.newUsersToday ?? 0} today)
                                    </div>
                                </div>
                            </div>

                            {/* Active Users */}
                            <div className="stats bg-base-100 shadow">
                                <div className="stat">
                                    <div className="stat-figure text-success">
                                        <i className="fa-solid fa-duotone fa-user-check text-3xl"></i>
                                    </div>
                                    <div className="stat-title">Active Users</div>
                                    <div className="stat-value text-success">
                                        {stats?.activeUsers7Days ?? '—'}
                                    </div>
                                    <div className="stat-desc">
                                        Last 7 days ({stats?.activeUsers30Days ?? 0} in 30d)
                                    </div>
                                </div>
                            </div>

                            {/* Growth Rate */}
                            <div className="stats bg-base-100 shadow">
                                <div className="stat">
                                    <div className="stat-figure text-info">
                                        <i className="fa-solid fa-duotone fa-chart-line text-3xl"></i>
                                    </div>
                                    <div className="stat-title">30-Day Growth</div>
                                    <div className="stat-value text-info">
                                        {stats?.newUsers30Days ?? 0}
                                    </div>
                                    <div className="stat-desc">
                                        New registrations
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Users by Role */}
                        {stats?.usersByRole && (
                            <div>
                                <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide mb-3">
                                    Users by Role
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="stats bg-base-100 shadow">
                                        <div className="stat">
                                            <div className="stat-figure text-base-content">
                                                <i className="fa-solid fa-duotone fa-user text-3xl"></i>
                                            </div>
                                            <div className="stat-title">Users</div>
                                            <div className="stat-value">{stats.usersByRole.user}</div>
                                            <div className="stat-desc">Regular members</div>
                                        </div>
                                    </div>
                                    <div className="stats bg-base-100 shadow">
                                        <div className="stat">
                                            <div className="stat-figure text-warning">
                                                <i className="fa-solid fa-duotone fa-shield text-3xl"></i>
                                            </div>
                                            <div className="stat-title">Moderators</div>
                                            <div className="stat-value text-warning">{stats.usersByRole.moderator}</div>
                                            <div className="stat-desc">Content reviewers</div>
                                        </div>
                                    </div>
                                    <div className="stats bg-base-100 shadow">
                                        <div className="stat">
                                            <div className="stat-figure text-error">
                                                <i className="fa-solid fa-duotone fa-crown text-3xl"></i>
                                            </div>
                                            <div className="stat-title">Admins</div>
                                            <div className="stat-value text-error">{stats.usersByRole.admin}</div>
                                            <div className="stat-desc">Platform administrators</div>
                                        </div>
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
                                    href="/admin/sources"
                                    className="btn btn-block btn-outline justify-start"
                                >
                                    <i className="fa-solid fa-duotone fa-spider text-info"></i>
                                    Crawler Sources
                                </Link>
                                <Link
                                    href="/admin/deletion-requests"
                                    className="btn btn-block btn-outline justify-start"
                                >
                                    <i className="fa-solid fa-duotone fa-user-slash text-error"></i>
                                    Deletion Requests
                                </Link>
                                <Link
                                    href="/admin/analytics"
                                    className="btn btn-block btn-outline justify-start"
                                >
                                    <i className="fa-solid fa-duotone fa-chart-line text-info"></i>
                                    Analytics Dashboard
                                </Link>
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
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="card-title text-xl">
                                    <i className={`fa-solid fa-duotone fa-server ${serviceStatuses.every(s => s.status === 'online') ? 'text-success' :
                                        serviceStatuses.some(s => s.status === 'offline') ? 'text-error' :
                                            'text-warning'
                                        }`}></i>
                                    System Status
                                </h2>
                                <button
                                    onClick={checkServiceHealth}
                                    className="btn btn-ghost btn-xs"
                                    title="Refresh status"
                                >
                                    <i className="fa-solid fa-duotone fa-rotate-right"></i>
                                </button>
                            </div>
                            <div className="space-y-3">
                                {serviceStatuses.length === 0 ? (
                                    <div className="text-center py-4 text-base-content/60">
                                        <div className="loading loading-spinner loading-sm"></div>
                                        <p className="text-xs mt-2">Checking services...</p>
                                    </div>
                                ) : (
                                    serviceStatuses.map((service) => (
                                        <div
                                            key={service.name}
                                            className="flex items-center justify-between p-3 bg-base-100 rounded"
                                        >
                                            <div className="flex-1">
                                                <span className="text-sm font-medium">{service.name}</span>
                                                {service.responseTime && (
                                                    <span className="text-xs text-base-content/60 ml-2">
                                                        ({service.responseTime}ms)
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className={`badge badge-sm ${service.status === 'online'
                                                    ? 'badge-success'
                                                    : service.status === 'offline'
                                                        ? 'badge-error'
                                                        : 'badge-warning'
                                                    }`}
                                            >
                                                {service.status === 'online' ? (
                                                    <>
                                                        <i className="fa-solid fa-duotone fa-check mr-1"></i>
                                                        Online
                                                    </>
                                                ) : service.status === 'offline' ? (
                                                    <>
                                                        <i className="fa-solid fa-duotone fa-xmark mr-1"></i>
                                                        Offline
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-duotone fa-question mr-1"></i>
                                                        Unknown
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    ))
                                )}
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
