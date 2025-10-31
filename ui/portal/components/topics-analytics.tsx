'use client';

import { useToaster } from '@/components/toaster';
import { AdminAPI, UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface TopicStats {
    id: string;
    name: string;
    description: string;
    color: string;
    contentCount: number;
    junctionCount: number;
    avgQuality: number;
    totalInteractions: number;
    recentAdditions7d: number;
    recentAdditions30d: number;
}

interface TopicAnalytics {
    topics: TopicStats[];
    totalContent: number;
    totalAssignments: number;
    emptyTopics: string[];
    dataQualityIssues: {
        topic: string;
        junctionCount: number;
        jsonbCount: number;
        missing: number;
    }[];
}

export default function TopicsAnalytics() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const { showToast } = useToaster();

    const [analytics, setAnalytics] = useState<TopicAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<'user' | 'moderator' | 'admin' | null>(null);
    const [checkingRole, setCheckingRole] = useState(true);
    const [sortBy, setSortBy] = useState<'name' | 'count' | 'quality' | 'recent'>('count');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

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
        fetchTopicsAnalytics();
    }, [isAdmin, checkingRole]);

    const fetchTopicsAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await getToken();
            if (!token) {
                setError('Authentication required');
                return;
            }

            const data = await AdminAPI.getTopicsAnalytics(token);
            setAnalytics(data);
        } catch (err) {
            console.error('Error fetching topics analytics:', err);
            setError('Failed to load topics analytics');
            showToast('Failed to load analytics', 'error');
        } finally {
            setLoading(false);
        }
    };

    const sortedTopics = analytics?.topics ? [...analytics.topics].sort((a, b) => {
        let aVal: number | string = 0;
        let bVal: number | string = 0;

        switch (sortBy) {
            case 'name':
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
                break;
            case 'count':
                aVal = a.contentCount;
                bVal = b.contentCount;
                break;
            case 'quality':
                aVal = a.avgQuality;
                bVal = b.avgQuality;
                break;
            case 'recent':
                aVal = a.recentAdditions7d;
                bVal = b.recentAdditions7d;
                break;
        }

        if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    }) : [];

    if (checkingRole) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                    <p className="mt-4 text-base-content/70">Checking permissions...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-base-100">
                <div className="container mx-auto px-4 py-8">
                    <div className="alert alert-error">
                        <i className="fa-solid fa-duotone fa-shield-exclamation text-2xl"></i>
                        <div>
                            <h3 className="font-bold">Access Denied</h3>
                            <div className="">You do not have permission to view this page.</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-base-content mb-2">Topics Analytics</h1>
                            <p className="text-base-content/70">
                                Content distribution and quality metrics by topic
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="loading loading-spinner loading-lg text-primary"></div>
                            <p className="mt-4 text-base-content/70">Loading analytics...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="alert alert-error">
                        <i className="fa-solid fa-duotone fa-circle-exclamation"></i>
                        <div>
                            <h3 className="font-bold">Error</h3>
                            <div className="">{error}</div>
                        </div>
                        <button onClick={fetchTopicsAnalytics} className="btn btn-sm">
                            Retry
                        </button>
                    </div>
                ) : analytics ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="stats bg-primary/10 shadow-md border border-primary/20">
                                <div className="stat">
                                    <div className="stat-figure text-primary">
                                        <i className="fa-solid fa-duotone fa-tags text-4xl"></i>
                                    </div>
                                    <h3 className="stat-title font-semibold text-base-content/70 uppercase tracking-wide">
                                        Total Topics
                                    </h3>
                                    <div className="stat-value text-primary">
                                        {analytics.topics.length}
                                    </div>
                                    <div className="stat-desc text-base-content/60">
                                        {analytics.emptyTopics.length} empty
                                    </div>
                                </div>
                            </div>

                            <div className="stats bg-success/10 shadow-md border border-success/20">
                                <div className="stat">
                                    <div className="stat-figure text-success">
                                        <i className="fa-solid fa-duotone fa-file-lines text-4xl"></i>
                                    </div>
                                    <h3 className="stat-title font-semibold text-base-content/70 uppercase tracking-wide">
                                        Total Content
                                    </h3>
                                    <div className="stat-value text-success">
                                        {analytics.totalContent.toLocaleString()}
                                    </div>
                                    <div className="stat-desc text-base-content/60">
                                        Unique items
                                    </div>
                                </div>
                            </div>

                            <div className="stats bg-info/10 shadow-md border border-info/20">
                                <div className="stat">
                                    <div className="stat-figure text-info">
                                        <i className="fa-solid fa-duotone fa-link text-4xl"></i>
                                    </div>
                                    <h3 className="stat-title font-semibold text-base-content/70 uppercase tracking-wide">
                                        Assignments
                                    </h3>
                                    <div className="stat-value text-info">
                                        {analytics.totalAssignments.toLocaleString()}
                                    </div>
                                    <div className="stat-desc text-base-content/60">
                                        Topic links
                                    </div>
                                </div>
                            </div>

                            <div className={`stats shadow-md border ${analytics.dataQualityIssues.length > 0
                                ? 'bg-warning/10 border-warning/20'
                                : 'bg-success/10 border-success/20'
                                }`}>
                                <div className="stat">
                                    <div className={`stat-figure ${analytics.dataQualityIssues.length > 0 ? 'text-warning' : 'text-success'}`}>
                                        <i className={`fa-solid fa-duotone ${analytics.dataQualityIssues.length > 0 ? 'fa-triangle-exclamation' : 'fa-check-circle'} text-4xl`}></i>
                                    </div>
                                    <h3 className="stat-title font-semibold text-base-content/70 uppercase tracking-wide">
                                        Data Quality
                                    </h3>
                                    <div className={`stat-value ${analytics.dataQualityIssues.length > 0 ? 'text-warning' : 'text-success'}`}>
                                        {analytics.dataQualityIssues.length > 0 ? `${analytics.dataQualityIssues.length}` : '✓'}
                                    </div>
                                    <div className="stat-desc text-base-content/60">
                                        {analytics.dataQualityIssues.length > 0 ? 'Issues found' : 'All synced'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Data Quality Issues Alert */}
                        {analytics.dataQualityIssues.length > 0 && (
                            <div className="alert alert-warning mb-6">
                                <i className="fa-solid fa-duotone fa-triangle-exclamation text-2xl"></i>
                                <div className="flex-1">
                                    <h3 className="font-bold">Data Synchronization Issues Detected</h3>
                                    <div className=" mt-1">
                                        {analytics.dataQualityIssues.length} topic{analytics.dataQualityIssues.length !== 1 ? 's have' : ' has'} mismatched counts between junction table and JSONB storage.
                                        This may affect discovery queries.
                                    </div>
                                    <div className="mt-2">
                                        <details className="">
                                            <summary className="cursor-pointer font-semibold">View Issues</summary>
                                            <ul className="mt-2 space-y-1">
                                                {analytics.dataQualityIssues.slice(0, 10).map(issue => (
                                                    <li key={issue.topic}>
                                                        <span className="font-medium">{issue.topic}:</span> Junction={issue.junctionCount}, JSONB={issue.jsonbCount}
                                                        <span className="text-error ml-2">({issue.missing} missing)</span>
                                                    </li>
                                                ))}
                                                {analytics.dataQualityIssues.length > 10 && (
                                                    <li className="text-base-content/60">... and {analytics.dataQualityIssues.length - 10} more</li>
                                                )}
                                            </ul>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="card bg-base-200 shadow-md mb-6">
                            <div className="card-body">
                                <div className="flex flex-wrap gap-4 items-center justify-between">
                                    {/* View Mode Toggle */}
                                    <div className="join">
                                        <button
                                            className={`btn join-item btn-sm ${viewMode === 'table' ? 'btn-active' : 'btn-ghost'}`}
                                            onClick={() => setViewMode('table')}
                                        >
                                            <i className="fa-solid fa-duotone fa-table"></i>
                                            Table
                                        </button>
                                        <button
                                            className={`btn join-item btn-sm ${viewMode === 'grid' ? 'btn-active' : 'btn-ghost'}`}
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <i className="fa-solid fa-duotone fa-grid"></i>
                                            Grid
                                        </button>
                                    </div>

                                    {/* Sort Controls */}
                                    <div className="flex gap-2 items-center">
                                        <span className=" text-base-content/70">Sort by:</span>
                                        <select
                                            className="select select-bordered select-sm"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                        >
                                            <option value="count">Content Count</option>
                                            <option value="name">Name</option>
                                            <option value="quality">Quality Score</option>
                                            <option value="recent">Recent Activity</option>
                                        </select>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                        >
                                            <i className={`fa-solid fa-duotone fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                                        </button>
                                    </div>

                                    {/* Refresh Button */}
                                    <button
                                        onClick={fetchTopicsAnalytics}
                                        className="btn btn-ghost btn-sm"
                                        title="Refresh data"
                                    >
                                        <i className="fa-solid fa-duotone fa-rotate-right"></i>
                                        Refresh
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Topics Display */}
                        {viewMode === 'table' ? (
                            <div className="card bg-base-200 shadow-md overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Topic</th>
                                            <th className="text-right">Content</th>
                                            <th className="text-right">Avg Quality</th>
                                            <th className="text-right">7d Activity</th>
                                            <th className="text-right">30d Activity</th>
                                            <th className="text-right">Interactions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedTopics.map(topic => (
                                            <tr key={topic.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: topic.color }}
                                                        ></div>
                                                        <div>
                                                            <div className="font-bold">{topic.name}</div>
                                                            <div className=" text-base-content/60 max-w-md truncate">
                                                                {topic.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-right">
                                                    <span className="font-mono font-semibold">
                                                        {topic.contentCount.toLocaleString()}
                                                    </span>
                                                    {topic.contentCount !== topic.junctionCount && (
                                                        <span className="ml-2 badge badge-warning badge-xs" title="Data sync issue">
                                                            ⚠
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-2 bg-base-300 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-success"
                                                                style={{ width: `${topic.avgQuality * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className=" font-mono">
                                                            {(topic.avgQuality * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="text-right">
                                                    <span className={topic.recentAdditions7d > 0 ? 'text-success' : 'text-base-content/40'}>
                                                        {topic.recentAdditions7d > 0 ? '+' : ''}{topic.recentAdditions7d}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <span className={topic.recentAdditions30d > 0 ? 'text-success' : 'text-base-content/40'}>
                                                        {topic.recentAdditions30d > 0 ? '+' : ''}{topic.recentAdditions30d}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <span className="font-mono">
                                                        {topic.totalInteractions.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortedTopics.map(topic => (
                                    <div key={topic.id} className="card bg-base-200 shadow-md">
                                        <div className="card-body">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div
                                                    className="w-4 h-4 rounded-full mt-1"
                                                    style={{ backgroundColor: topic.color }}
                                                ></div>
                                                <div className="flex-1">
                                                    <h3 className="card-title text-lg">{topic.name}</h3>
                                                    <p className=" text-base-content/60 line-clamp-2">
                                                        {topic.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="divider my-2"></div>

                                            <div className="grid grid-cols-2 gap-3 ">
                                                <div>
                                                    <div className="text-base-content/60">Content</div>
                                                    <div className="font-bold text-lg">
                                                        {topic.contentCount.toLocaleString()}
                                                        {topic.contentCount !== topic.junctionCount && (
                                                            <span className="ml-2 badge badge-warning badge-xs">⚠</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-base-content/60">Quality</div>
                                                    <div className="font-bold text-lg">
                                                        {(topic.avgQuality * 100).toFixed(0)}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-base-content/60">7d Activity</div>
                                                    <div className={`font-bold ${topic.recentAdditions7d > 0 ? 'text-success' : 'text-base-content/40'}`}>
                                                        {topic.recentAdditions7d > 0 ? '+' : ''}{topic.recentAdditions7d}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-base-content/60">Interactions</div>
                                                    <div className="font-bold">
                                                        {topic.totalInteractions.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty Topics */}
                        {analytics.emptyTopics.length > 0 && (
                            <div className="card bg-base-200 shadow-md mt-6">
                                <div className="card-body">
                                    <h2 className="card-title text-lg">
                                        <i className="fa-solid fa-duotone fa-inbox text-base-content/60"></i>
                                        Empty Topics ({analytics.emptyTopics.length})
                                    </h2>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {analytics.emptyTopics.map(topic => (
                                            <span key={topic} className="badge badge-ghost">
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
}
