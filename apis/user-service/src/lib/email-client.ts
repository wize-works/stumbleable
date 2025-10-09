/**
 * Email Service Client
 * Handles sending emails via the email service API
 */

const EMAIL_SERVICE_URL = process.env.EMAIL_API_URL || 'http://email-service:8080';

export interface SendEmailRequest {
    user_id: string;
    recipient_email: string;
    email_type: string;
    subject: string;
    template_data: Record<string, any>;
}

export interface SendEmailResponse {
    emailId?: string;
    success?: boolean;
}

export class EmailClient {
    /**
     * Queue an email to be sent via the email service
     */
    static async queueEmail(emailRequest: SendEmailRequest): Promise<boolean> {
        try {
            console.log(`📧 Queueing ${emailRequest.email_type} email to ${emailRequest.recipient_email}`);

            const response = await fetch(`${EMAIL_SERVICE_URL}/api/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailRequest),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`❌ Failed to queue email: ${response.status} ${error}`);
                return false;
            }

            const result = await response.json() as SendEmailResponse;
            console.log(`✅ Email queued successfully: ${result.emailId || 'unknown ID'}`);
            return true;
        } catch (error: any) {
            console.error(`❌ Error queueing email:`, error.message);
            return false;
        }
    }

    /**
     * Send welcome email to new user
     */
    static async sendWelcomeEmail(userId: string, email: string, firstName?: string): Promise<boolean> {
        return this.queueEmail({
            user_id: userId,
            recipient_email: email,
            email_type: 'welcome',
            subject: 'Welcome to Stumbleable! 🎉',
            template_data: {
                firstName: firstName || email.split('@')[0],
                email: email,
            },
        });
    }

    /**
     * Send account deletion request confirmation email
     */
    static async sendDeletionRequestEmail(
        userId: string,
        email: string,
        scheduledDeletionAt: string,
        deletionRequestId: string
    ): Promise<boolean> {
        return this.queueEmail({
            user_id: userId,
            recipient_email: email,
            email_type: 'deletion-request',
            subject: 'Account Deletion Requested - Stumbleable',
            template_data: {
                email: email,
                scheduledDeletionAt: scheduledDeletionAt,
                deletionRequestId: deletionRequestId,
            },
        });
    }

    /**
     * Send account deletion cancelled email
     */
    static async sendDeletionCancelledEmail(
        userId: string,
        email: string,
        firstName?: string
    ): Promise<boolean> {
        return this.queueEmail({
            user_id: userId,
            recipient_email: email,
            email_type: 'deletion-cancelled',
            subject: 'Account Deletion Cancelled - Stumbleable',
            template_data: {
                firstName: firstName || email.split('@')[0],
                email: email,
            },
        });
    }

    /**
     * Send 7-day deletion reminder email
     */
    static async send7DayDeletionReminderEmail(
        userId: string,
        email: string,
        scheduledDeletionAt: string,
        deletionRequestId: string
    ): Promise<boolean> {
        return this.queueEmail({
            user_id: userId,
            recipient_email: email,
            email_type: 'deletion-reminder-7d',
            subject: '7 Days Until Account Deletion - Stumbleable',
            template_data: {
                email: email,
                daysRemaining: 7,
                scheduledDeletionAt: scheduledDeletionAt,
                deletionRequestId: deletionRequestId,
            },
        });
    }

    /**
     * Send 1-day deletion reminder email
     */
    static async send1DayDeletionReminderEmail(
        userId: string,
        email: string,
        scheduledDeletionAt: string,
        deletionRequestId: string
    ): Promise<boolean> {
        return this.queueEmail({
            user_id: userId,
            recipient_email: email,
            email_type: 'deletion-reminder-1d',
            subject: 'Final Warning: Account Deletion Tomorrow - Stumbleable',
            template_data: {
                email: email,
                daysRemaining: 1,
                scheduledDeletionAt: scheduledDeletionAt,
                deletionRequestId: deletionRequestId,
            },
        });
    }

    /**
     * Send account deletion complete email
     */
    static async sendDeletionCompleteEmail(
        userId: string,
        email: string
    ): Promise<boolean> {
        return this.queueEmail({
            user_id: userId,
            recipient_email: email,
            email_type: 'deletion-complete',
            subject: 'Account Deleted - Stumbleable',
            template_data: {
                email: email,
            },
        });
    }
}
