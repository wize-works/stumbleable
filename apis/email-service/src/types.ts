export interface EmailQueueItem {
    id: string;
    user_id: string;
    email_type: string;
    recipient_email: string;
    subject: string;
    template_data: Record<string, any>;
    status: 'pending' | 'sent' | 'failed';
    attempts: number;
    max_attempts: number;
    scheduled_at: string;
    sent_at?: string;
    error_message?: string;
    created_at: string;
}

export interface EmailPreferences {
    user_id: string;
    welcome_email: boolean;
    weekly_trending: boolean;
    weekly_new: boolean;
    saved_digest: boolean;
    submission_updates: boolean;
    re_engagement: boolean;
    account_notifications: boolean;
    unsubscribed_all: boolean;
    created_at: string;
    updated_at: string;
}

export interface EmailLog {
    id: string;
    user_id?: string;
    email_type: string;
    recipient_email: string;
    resend_id?: string;
    status: 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';
    opened_at?: string;
    clicked_at?: string;
    error_message?: string;
    created_at: string;
}

export interface SendEmailRequest {
    userId: string;
    emailType: string;
    recipientEmail: string;
    templateData: Record<string, any>;
    scheduledAt?: Date;
}

export interface UpdatePreferencesRequest {
    welcome_email?: boolean;
    weekly_trending?: boolean;
    weekly_new?: boolean;
    saved_digest?: boolean;
    submission_updates?: boolean;
    re_engagement?: boolean;
    account_notifications?: boolean;
    unsubscribed_all?: boolean;
}

export interface ScheduledJobRequest {
    jobType: 'weekly-trending' | 'weekly-new';
}

export interface Discovery {
    id: string;
    url: string;
    title: string;
    description?: string;
    image_url?: string;
    domain: string;
    topics: string[];
    like_count?: number;
    save_count?: number;
    share_count?: number;
}

export interface EmailTemplateProps {
    // Common props
    frontendUrl: string;
    unsubscribeUrl: string;

    // User props
    firstName?: string;
    email: string;

    // Template-specific props (added as needed)
    [key: string]: any;
}

export interface WelcomeEmailProps extends EmailTemplateProps {
    firstName: string;
    preferredTopics?: string[];
}

export interface WeeklyTrendingEmailProps extends EmailTemplateProps {
    discoveries: Discovery[];
    weekStart: string;
    weekEnd: string;
}

export interface WeeklyNewEmailProps extends EmailTemplateProps {
    discoveries: Discovery[];
    weekStart: string;
    weekEnd: string;
}

export interface DeletionRequestEmailProps extends EmailTemplateProps {
    scheduledDeletionDate: string;
    cancelUrl: string;
}

export interface DeletionReminderEmailProps extends EmailTemplateProps {
    daysRemaining: number;
    scheduledDeletionDate: string;
    cancelUrl: string;
}

export interface DeletionCompleteEmailProps extends EmailTemplateProps {
    deletionDate: string;
}

export interface DeletionCancelledEmailProps extends EmailTemplateProps {
    cancelledDate: string;
}

export interface SubmissionEmailProps extends EmailTemplateProps {
    submissionUrl: string;
    submissionTitle: string;
    reason?: string;
}

export interface SavedDigestEmailProps extends EmailTemplateProps {
    discoveries: Discovery[];
    totalSaved: number;
    periodStart: string;
    periodEnd: string;
}

export interface ReEngagementEmailProps extends EmailTemplateProps {
    discoveries: Discovery[];
    daysSinceLastVisit: number;
    totalSavedCount?: number;
}

export type EmailType =
    | 'welcome'
    | 'deletion-request'
    | 'deletion-reminder-7d'
    | 'deletion-reminder-1d'
    | 'deletion-complete'
    | 'deletion-cancelled'
    | 'weekly-trending'
    | 'weekly-new'
    | 'submission-received'
    | 'submission-approved'
    | 'submission-rejected'
    | 'saved-digest'
    | 're-engagement';
