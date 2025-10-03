import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { SubmissionEmailProps } from '../types';
import { EmailLayout } from './components/EmailLayout';

export function SubmissionRejectedEmail({
    submissionUrl,
    submissionTitle,
    reason,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: SubmissionEmailProps) {
    return (
        <EmailLayout
            previewText="Your submission was not approved"
            unsubscribeUrl={unsubscribeUrl}
        >
            <Section style={header}>
                <Text style={headerIcon}>📋</Text>
                <Heading style={h1}>Submission Not Approved</Heading>
            </Section>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                Thank you for your recent submission to Stumbleable. Unfortunately, we're unable to approve
                this content at this time.
            </Text>

            <Section style={submissionBox}>
                <Text style={submissionLabel}>SUBMISSION</Text>
                <Text style={submissionUrlText}>{submissionUrl}</Text>
                <Text style={submissionTitleText}>{submissionTitle}</Text>
            </Section>

            {reason && (
                <>
                    <Heading style={h2}>Reason for Rejection</Heading>
                    <Section style={reasonBox}>
                        <Text style={reasonText}>{reason}</Text>
                    </Section>
                </>
            )}

            <Heading style={h2}>Common Reasons for Rejection</Heading>

            <Section style={reasonsList}>
                <ReasonItem
                    icon="🚫"
                    title="Content Policy Violation"
                    description="Content that violates our community guidelines, includes spam, explicit material, or misleading information."
                />
                <ReasonItem
                    icon="🔗"
                    title="Broken or Invalid Link"
                    description="The URL doesn't work, leads to an error page, or requires login/payment to access."
                />
                <ReasonItem
                    icon="📉"
                    title="Low Quality"
                    description="Content that's thin, poorly written, or doesn't provide significant value to users."
                />
                <ReasonItem
                    icon="🔄"
                    title="Duplicate Content"
                    description="The same URL or very similar content has already been submitted."
                />
            </Section>

            <Section style={guidelinesBox}>
                <Text style={guidelinesTitle}>📖 Review Our Guidelines</Text>
                <Text style={guidelinesText}>
                    Before resubmitting, please review our{' '}
                    <a href={`${frontendUrl}/guidelines`} style={link}>
                        content guidelines
                    </a>{' '}
                    to ensure your submission meets our quality standards.
                </Text>
            </Section>

            <Hr style={hr} />

            <Heading style={h2}>What You Can Do</Heading>

            <Section style={actionsList}>
                <ActionItem
                    number="1"
                    text="Review the rejection reason and our content guidelines"
                />
                <ActionItem number="2" text="Fix any issues with your submission" />
                <ActionItem
                    number="3"
                    text="Submit different content that meets our guidelines"
                />
            </Section>

            <Section style={buttonContainer}>
                <Button style={buttonPrimary} href={`${frontendUrl}/submit`}>
                    Submit New Content
                </Button>
            </Section>

            <Section style={helpBox}>
                <Text style={helpTitle}>Need Help?</Text>
                <Text style={helpText}>
                    If you believe this rejection was made in error or have questions about our guidelines,{' '}
                    <a href={`${frontendUrl}/contact?subject=Submission_Appeal`} style={link}>
                        contact our support team
                    </a>
                    . Please include the submission URL in your message.
                </Text>
            </Section>

            <Section style={encouragementBox}>
                <Text style={encouragementText}>
                    ✨ <strong>Don't give up!</strong> Every contributor gets rejections sometimes. The key
                    is learning what makes great content and trying again. We appreciate your willingness to
                    share discoveries with the community.
                </Text>
            </Section>

            <Text style={signature}>
                — The Stumbleable Team
            </Text>
        </EmailLayout>
    );
}

interface ReasonItemProps {
    icon: string;
    title: string;
    description: string;
}

function ReasonItem({ icon, title, description }: ReasonItemProps) {
    return (
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '16px' }}>
            <tr>
                <td width="32" style={{ verticalAlign: 'top' as const }}>
                    <Text style={reasonIcon}>{icon}</Text>
                </td>
                <td>
                    <Text style={reasonTitle}>{title}</Text>
                    <Text style={reasonDescription}>{description}</Text>
                </td>
            </tr>
        </table>
    );
}

interface ActionItemProps {
    number: string;
    text: string;
}

function ActionItem({ number, text }: ActionItemProps) {
    return (
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '12px' }}>
            <tr>
                <td width="36" style={{ verticalAlign: 'top' as const }}>
                    <div style={actionNumber}>{number}</div>
                </td>
                <td>
                    <Text style={actionText}>{text}</Text>
                </td>
            </tr>
        </table>
    );
}

// Styles
const header = {
    textAlign: 'center' as const,
    margin: '24px 0',
};

const headerIcon = {
    fontSize: '48px',
    margin: '0 0 16px 0',
    lineHeight: '1',
};

const h1 = {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: 'bold' as const,
    margin: '0 0 24px',
    lineHeight: '1.3',
    textAlign: 'center' as const,
};

const h2 = {
    color: '#1f2937',
    fontSize: '20px',
    fontWeight: 'bold' as const,
    margin: '32px 0 16px',
};

const text = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 0',
};

const submissionBox = {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
    borderLeft: '4px solid #6b7280',
};

const submissionLabel = {
    color: '#6b7280',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    margin: '0 0 8px 0',
    fontWeight: 'bold' as const,
};

const submissionUrlText = {
    color: '#6366f1',
    fontSize: '14px',
    margin: '0 0 8px 0',
    wordBreak: 'break-all' as const,
};

const submissionTitleText = {
    color: '#1f2937',
    fontSize: '16px',
    fontWeight: '600' as const,
    margin: 0,
};

const reasonBox = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0 24px',
};

const reasonText = {
    color: '#991b1b',
    fontSize: '15px',
    lineHeight: '22px',
    margin: 0,
};

const reasonsList = {
    margin: '24px 0',
};

const reasonIcon = {
    fontSize: '20px',
    margin: 0,
    lineHeight: '1',
};

const reasonTitle = {
    color: '#1f2937',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 4px 0',
    lineHeight: '1.4',
};

const reasonDescription = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
};

const guidelinesBox = {
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const guidelinesTitle = {
    color: '#1e40af',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const guidelinesText = {
    color: '#1e3a8a',
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '32px 0',
};

const actionsList = {
    margin: '16px 0',
};

const actionNumber = {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    lineHeight: '28px',
};

const actionText = {
    color: '#374151',
    fontSize: '15px',
    margin: 0,
    lineHeight: '28px',
};

const buttonContainer = {
    margin: '32px 0',
    textAlign: 'center' as const,
};

const buttonPrimary = {
    backgroundColor: '#6366f1',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
};

const helpBox = {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const helpTitle = {
    color: '#1f2937',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const helpText = {
    color: '#4b5563',
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
};

const encouragementBox = {
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const encouragementText = {
    color: '#78350f',
    fontSize: '14px',
    lineHeight: '22px',
    margin: 0,
};

const signature = {
    color: '#9ca3af',
    fontSize: '14px',
    margin: '24px 0 4px',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
};

const link = {
    color: '#6366f1',
    textDecoration: 'underline',
};

export default SubmissionRejectedEmail;
