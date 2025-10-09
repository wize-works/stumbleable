/**
 * Email Service Client for Moderation Service
 * Handles sending submission review emails via the email service API
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
     * Send submission approved email
     */
    static async sendSubmissionApprovedEmail(
        userId: string,
        email: string,
        submissionTitle: string,
        submissionUrl: string,
        discoveryId: string
    ): Promise<boolean> {
        return this.queueEmail({
            user_id: userId,
            recipient_email: email,
            email_type: 'submission-approved',
            subject: '🎉 Your content has been approved! - Stumbleable',
            template_data: {
                email: email,
                submissionTitle: submissionTitle,
                submissionUrl: submissionUrl,
                discoveryId: discoveryId,
            },
        });
    }

    /**
     * Send submission rejected email
     */
    static async sendSubmissionRejectedEmail(
        userId: string,
        email: string,
        submissionTitle: string,
        submissionUrl: string,
        rejectionReason?: string
    ): Promise<boolean> {
        return this.queueEmail({
            user_id: userId,
            recipient_email: email,
            email_type: 'submission-rejected',
            subject: 'Update on your content submission - Stumbleable',
            template_data: {
                email: email,
                submissionTitle: submissionTitle,
                submissionUrl: submissionUrl,
                rejectionReason: rejectionReason || 'The submitted content did not meet our community guidelines.',
            },
        });
    }
}
