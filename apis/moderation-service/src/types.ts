export interface ModerationQueueItem {
    id: string;
    content_id: string;
    content_type: 'discovery' | 'submission';
    title: string;
    url: string;
    domain: string;
    description: string | null;
    submitted_by: string | null;
    status: 'pending' | 'approved' | 'rejected';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    reviewed_by: string | null;
    reviewed_at: string | null;
    review_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContentReport {
    id: string;
    content_id: string;
    content_type: 'discovery' | 'submission';
    reported_by: string;
    reason: string;
    description: string | null;
    status: 'pending' | 'resolved' | 'dismissed';
    resolved_by: string | null;
    resolved_at: string | null;
    resolution_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface DomainReputation {
    id: string;
    domain: string;
    trust_score: number;
    total_approved: number;
    total_rejected: number;
    is_blacklisted: boolean;
    blacklist_reason: string | null;
    notes: string | null;
    last_reviewed: string | null;
    created_at: string;
    updated_at: string;
}

export interface ModerationAnalytics {
    totalPending: number;
    totalReviewed: number;
    totalApproved: number;
    totalRejected: number;
    avgReviewTime: number | null;
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
}

export interface ListModerationQueueParams {
    status?: 'pending' | 'approved' | 'rejected' | 'reviewing' | 'all';
    search?: string;
    limit?: number;
    offset?: number;
}

export interface ListContentReportsParams {
    status?: 'pending' | 'resolved' | 'dismissed' | 'all';
    discoveryId?: string;
    limit?: number;
    offset?: number;
}

export interface ListDomainReputationsParams {
    search?: string;
    blacklistedOnly?: boolean;
    minScore?: number;
    maxScore?: number;
    limit?: number;
    offset?: number;
}

export interface BulkReviewResult {
    approved?: number;
    rejected?: number;
    failed: string[];
}
