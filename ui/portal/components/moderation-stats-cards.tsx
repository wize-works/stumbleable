'use client';

interface ModerationStats {
    totalPending: number;
    totalReviewed: number;
    totalApproved: number;
    totalRejected: number;
    avgReviewTime: number | null;
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
}

interface ModerationStatsCardsProps {
    stats: ModerationStats | null;
    loading: boolean;
}

export default function ModerationStatsCards({ stats, loading }: ModerationStatsCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="card bg-base-200 shadow-md">
                        <div className="card-body">
                            <div className="animate-pulse">
                                <div className="h-4 bg-base-300 rounded w-3/4 mb-4"></div>
                                <div className="h-8 bg-base-300 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const totalItems = stats.totalPending + stats.totalReviewed;
    const approvalRate =
        stats.totalReviewed > 0 ? (stats.totalApproved / stats.totalReviewed) * 100 : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Items */}
            <div className="card bg-base-200 shadow-md">
                <div className="card-body">
                    <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                        Total Queue Items
                    </h3>
                    <p className="text-3xl font-bold text-base-content">{totalItems.toLocaleString()}</p>
                    <div className="text-xs text-base-content/60 mt-2">
                        {stats.totalPending} pending
                    </div>
                </div>
            </div>

            {/* Approval Rate */}
            <div className="card bg-base-200 shadow-md">
                <div className="card-body">
                    <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                        Approval Rate
                    </h3>
                    <p className="text-3xl font-bold text-success">
                        {approvalRate.toFixed(1)}%
                    </p>
                    <div className="text-xs text-base-content/60 mt-2">
                        {stats.totalApproved} approved, {stats.totalRejected} rejected
                    </div>
                </div>
            </div>

            {/* Content Reports */}
            <div className="card bg-base-200 shadow-md">
                <div className="card-body">
                    <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                        Content Reports
                    </h3>
                    <p className="text-3xl font-bold text-info">
                        {stats.totalReports}
                    </p>
                    <div className="text-xs text-base-content/60 mt-2">
                        {stats.pendingReports} pending, {stats.resolvedReports} resolved
                    </div>
                </div>
            </div>

            {/* Avg Review Time */}
            <div className="card bg-base-200 shadow-md">
                <div className="card-body">
                    <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">
                        Avg Review Time
                    </h3>
                    <p className="text-3xl font-bold text-warning">
                        {stats.avgReviewTime === null || stats.avgReviewTime === 0
                            ? 'N/A'
                            : stats.avgReviewTime < 1
                                ? `${Math.round(stats.avgReviewTime * 60)}m`
                                : `${stats.avgReviewTime.toFixed(1)}h`}
                    </p>
                    <div className="text-xs text-base-content/60 mt-2">
                        Time to decision
                    </div>
                </div>
            </div>
        </div>
    );
}
