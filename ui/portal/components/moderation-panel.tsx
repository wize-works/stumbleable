'use client';

import { useToaster } from '@/components/toaster';
import {
    ModerationAPI,
    UserAPI,
    type ContentReport,
    type DomainReputation,
    type ModerationAnalytics,
    type ModerationQueueItem,
} from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import ContentReportsTab from './content-reports-tab';
import DomainReputationTab from './domain-reputation-tab';
import ModerationQueueTab from './moderation-queue-tab';
import ModerationStatsCards from './moderation-stats-cards';

export default function ModerationPanel() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const { showToast } = useToaster();

    const [activeTab, setActiveTab] = useState<'queue' | 'reports' | 'domains'>('queue');
    const [moderationQueue, setModerationQueue] = useState<ModerationQueueItem[]>([]);
    const [contentReports, setContentReports] = useState<ContentReport[]>([]);
    const [domainReputations, setDomainReputations] = useState<DomainReputation[]>([]);
    const [analytics, setAnalytics] = useState<ModerationAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<'user' | 'moderator' | 'admin' | null>(null);
    const [checkingRole, setCheckingRole] = useState(true);
    const [authToken, setAuthToken] = useState<string | null>(null);

    // Check user role and get auth token
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

                setAuthToken(token);
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

            const token = await getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const [queueData, reportsData, domainsData, analyticsData] = await Promise.all([
                ModerationAPI.listModerationQueue({ status: 'pending', limit: 50 }, token),
                ModerationAPI.listContentReports({ status: 'pending', limit: 50 }, token),
                ModerationAPI.listDomainReputations({ limit: 20 }, token),
                ModerationAPI.getModerationAnalytics(token),
            ]);

            setModerationQueue(queueData.items || []);
            setContentReports(reportsData.reports || []);
            setDomainReputations(domainsData.domains || []);
            setAnalytics(analyticsData.analytics);
        } catch (error) {
            console.error('Error fetching moderation data:', error);
            setError('Failed to load moderation data');
            showToast('Failed to load moderation data', 'error');
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

                {/* Analytics Cards */}
                <ModerationStatsCards stats={analytics} loading={loading && !analytics} />

                {/* Tab Navigation */}
                <div className="tabs tabs-border space-x-4 mb-8">
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
                    <button
                        className={`tab tab-lg ${activeTab === 'domains' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('domains')}
                    >
                        Domain Reputation ({domainReputations.length})
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'queue' && (
                    <ModerationQueueTab
                        items={moderationQueue}
                        loading={loading}
                        onRefresh={fetchModerationData}
                        token={authToken}
                    />
                )}

                {activeTab === 'reports' && (
                    <ContentReportsTab
                        reports={contentReports}
                        loading={loading}
                        onRefresh={fetchModerationData}
                        token={authToken}
                    />
                )}

                {activeTab === 'domains' && (
                    <DomainReputationTab
                        domains={domainReputations}
                        loading={loading}
                        onRefresh={fetchModerationData}
                        token={authToken}
                    />
                )}
            </div>
        </div>
    );
}