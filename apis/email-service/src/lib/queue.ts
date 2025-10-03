import { render } from '@react-email/render';
import React from 'react';
import type { EmailQueueItem, EmailType } from '../types.js';
import { EMAIL_FROM, FRONTEND_URL, resend, UNSUBSCRIBE_URL } from './resend.js';
import { supabase } from './supabase.js';

// Import email templates
import DeletionCancelledEmail from '../templates/deletion-cancelled.js';
import DeletionCompleteEmail from '../templates/deletion-complete.js';
import DeletionReminderEmail from '../templates/deletion-reminder.js';
import DeletionRequestEmail from '../templates/deletion-request.js';
import ReEngagementEmail from '../templates/re-engagement.js';
import SavedDigestEmail from '../templates/saved-digest.js';
import SubmissionApprovedEmail from '../templates/submission-approved.js';
import SubmissionReceivedEmail from '../templates/submission-received.js';
import SubmissionRejectedEmail from '../templates/submission-rejected.js';
import WeeklyNewEmail from '../templates/weekly-new.js';
import WeeklyTrendingEmail from '../templates/weekly-trending.js';
import WelcomeEmail from '../templates/welcome.js';

const EMAIL_SUBJECTS: Record<EmailType, string> = {
    'welcome': 'Welcome to Stumbleable! 🎉',
    'deletion-request': 'Account Deletion Request Confirmation',
    'deletion-reminder-7d': 'Your account will be deleted in 7 days',
    'deletion-reminder-1d': 'Final Reminder: Account deletion tomorrow',
    'deletion-complete': 'Your Stumbleable account has been deleted',
    'deletion-cancelled': 'Account Deletion Cancelled - Welcome Back!',
    'weekly-trending': '🔥 This Week\'s Top 5 Trending Discoveries',
    'weekly-new': '✨ 5 Fresh Discoveries Just Added',
    'submission-received': 'We received your content submission',
    'submission-approved': '🎉 Your content has been approved!',
    'submission-rejected': 'Update on your content submission',
    'saved-digest': 'Your Weekly Saved Content Digest',
    're-engagement': 'We miss you! Here\'s what\'s new on Stumbleable',
};

/**
 * Email Queue Manager
 * Handles queueing, processing, and sending emails
 */
export class EmailQueue {
    /**
     * Add an email to the queue
     */
    static async enqueue(
        userId: string,
        emailType: EmailType,
        recipientEmail: string,
        templateData: Record<string, any>,
        scheduledAt: Date = new Date()
    ): Promise<string> {
        const subject = EMAIL_SUBJECTS[emailType] || 'Stumbleable Notification';

        const { data, error } = await supabase
            .from('email_queue')
            .insert({
                user_id: userId,
                email_type: emailType,
                recipient_email: recipientEmail,
                subject,
                template_data: templateData,
                scheduled_at: scheduledAt.toISOString(),
                status: 'pending',
                attempts: 0,
                max_attempts: 3,
            })
            .select('id')
            .single();

        if (error) {
            console.error('Failed to enqueue email:', error);
            throw new Error(`Failed to enqueue email: ${error.message}`);
        }

        console.log(`✅ Email queued: ${emailType} to ${recipientEmail} (ID: ${data.id})`);
        return data.id;
    }

    /**
     * Process pending emails in the queue
     */
    static async processPendingEmails(batchSize: number = 10): Promise<void> {
        // Get pending emails that are due to be sent
        const { data: pendingEmails, error } = await supabase
            .from('email_queue')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_at', new Date().toISOString())
            .lt('attempts', 3)
            .order('created_at', { ascending: true })
            .limit(batchSize);

        if (error) {
            console.error('Failed to fetch pending emails:', error);
            return;
        }

        if (!pendingEmails || pendingEmails.length === 0) {
            return;
        }

        console.log(`📬 Processing ${pendingEmails.length} pending emails...`);

        for (const emailItem of pendingEmails) {
            await this.sendEmail(emailItem);
        }
    }

    /**
     * Send a single email from the queue
     */
    private static async sendEmail(emailItem: EmailQueueItem): Promise<void> {
        try {
            // Check user preferences before sending
            const canSend = await this.checkUserPreferences(emailItem.user_id, emailItem.email_type);
            if (!canSend) {
                console.log(`⏭️  Skipping ${emailItem.email_type} - user has opted out`);
                await this.updateQueueItem(emailItem.id, 'sent', 'User opted out');
                return;
            }

            // Render email template
            const html = await this.renderEmailTemplate(
                emailItem.email_type as EmailType,
                emailItem.template_data
            );

            if (!html) {
                throw new Error(`Failed to render template for ${emailItem.email_type}`);
            }

            // Send via Resend
            if (resend) {
                const { data, error } = await resend.emails.send({
                    from: EMAIL_FROM,
                    to: emailItem.recipient_email,
                    subject: emailItem.subject,
                    html,
                    headers: {
                        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}?token=${emailItem.user_id}>`,
                        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                    },
                });

                if (error) {
                    throw error;
                }

                console.log(`✅ Email sent: ${emailItem.email_type} to ${emailItem.recipient_email} (Resend ID: ${data?.id})`);

                // Update queue status
                await this.updateQueueItem(emailItem.id, 'sent');

                // Log successful send
                await this.logEmail(emailItem, 'sent', data?.id);
            } else {
                // Simulate sending in development
                console.log(`🧪 [DEV] Would send email: ${emailItem.email_type} to ${emailItem.recipient_email}`);
                console.log(`📧 Subject: ${emailItem.subject}`);
                await this.updateQueueItem(emailItem.id, 'sent', 'Simulated in dev');
                await this.logEmail(emailItem, 'sent');
            }
        } catch (error: any) {
            console.error(`❌ Failed to send email ${emailItem.id}:`, error);

            const attempts = emailItem.attempts + 1;
            const newStatus = attempts >= emailItem.max_attempts ? 'failed' : 'pending';

            await this.updateQueueItem(
                emailItem.id,
                newStatus,
                error.message || 'Unknown error',
                attempts
            );

            await this.logEmail(emailItem, 'failed', undefined, error.message);
        }
    }

    /**
     * Check if user has enabled this email type
     */
    private static async checkUserPreferences(
        userId: string,
        emailType: string
    ): Promise<boolean> {
        const { data: prefs } = await supabase
            .from('email_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!prefs) {
            // No preferences set, allow by default (except marketing)
            return !['weekly-trending', 'weekly-new', 'saved-digest', 're-engagement'].includes(emailType);
        }

        // Check if user unsubscribed from all
        if (prefs.unsubscribed_all) {
            return false;
        }

        // Map email types to preference fields
        const prefMap: Record<string, keyof typeof prefs> = {
            'welcome': 'welcome_email',
            'deletion-request': 'account_notifications',
            'deletion-reminder-7d': 'account_notifications',
            'deletion-reminder-1d': 'account_notifications',
            'deletion-complete': 'account_notifications',
            'deletion-cancelled': 'account_notifications',
            'weekly-trending': 'weekly_trending',
            'weekly-new': 'weekly_new',
            'submission-received': 'submission_updates',
            'submission-approved': 'submission_updates',
            'submission-rejected': 'submission_updates',
            'saved-digest': 'saved_digest',
            're-engagement': 're_engagement',
        };

        const prefKey = prefMap[emailType];
        return prefKey ? prefs[prefKey] === true : true;
    }

    /**
     * Render email template using React Email
     */
    private static async renderEmailTemplate(
        emailType: EmailType,
        templateData: Record<string, any>
    ): Promise<string | null> {
        try {
            // Add common template data
            const fullData = {
                ...templateData,
                frontendUrl: FRONTEND_URL,
                unsubscribeUrl: UNSUBSCRIBE_URL,
            } as any; // Cast to any since templateData contains the required props

            // Select the appropriate template component
            let component;
            switch (emailType) {
                case 'welcome':
                    component = React.createElement(WelcomeEmail, fullData);
                    break;
                case 'weekly-trending':
                    component = React.createElement(WeeklyTrendingEmail, fullData);
                    break;
                case 'weekly-new':
                    component = React.createElement(WeeklyNewEmail, fullData);
                    break;
                case 'deletion-request':
                    component = React.createElement(DeletionRequestEmail, fullData);
                    break;
                case 'deletion-reminder-7d':
                    component = React.createElement(DeletionReminderEmail, { ...fullData, daysRemaining: 7 });
                    break;
                case 'deletion-reminder-1d':
                    component = React.createElement(DeletionReminderEmail, { ...fullData, daysRemaining: 1 });
                    break;
                case 'deletion-complete':
                    component = React.createElement(DeletionCompleteEmail, fullData);
                    break;
                case 'deletion-cancelled':
                    component = React.createElement(DeletionCancelledEmail, fullData);
                    break;
                case 'submission-received':
                    component = React.createElement(SubmissionReceivedEmail, fullData);
                    break;
                case 'submission-approved':
                    component = React.createElement(SubmissionApprovedEmail, fullData);
                    break;
                case 'submission-rejected':
                    component = React.createElement(SubmissionRejectedEmail, fullData);
                    break;
                case 'saved-digest':
                    component = React.createElement(SavedDigestEmail, fullData);
                    break;
                case 're-engagement':
                    component = React.createElement(ReEngagementEmail, fullData);
                    break;
                default:
                    console.error(`Unknown email type: ${emailType}`);
                    return null;
            }

            // Render React component to HTML string
            const html = await render(component, {
                pretty: false, // Set to true for debugging
            });

            return html;
        } catch (error) {
            console.error('Failed to render email template:', error);
            console.error('Template data:', templateData);
            return null;
        }
    }

    /**
     * Update queue item status
     */
    private static async updateQueueItem(
        id: string,
        status: 'pending' | 'sent' | 'failed',
        errorMessage?: string,
        attempts?: number
    ): Promise<void> {
        const updates: any = {
            status,
            error_message: errorMessage,
        };

        if (status === 'sent') {
            updates.sent_at = new Date().toISOString();
        }

        if (attempts !== undefined) {
            updates.attempts = attempts;
        }

        await supabase.from('email_queue').update(updates).eq('id', id);
    }

    /**
     * Log email send attempt
     */
    private static async logEmail(
        emailItem: EmailQueueItem,
        status: 'sent' | 'failed',
        resendId?: string,
        errorMessage?: string
    ): Promise<void> {
        await supabase.from('email_logs').insert({
            user_id: emailItem.user_id,
            email_type: emailItem.email_type,
            recipient_email: emailItem.recipient_email,
            resend_id: resendId,
            status,
            error_message: errorMessage,
        });
    }
}
