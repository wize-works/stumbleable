import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { SubmissionEmailProps } from '../types.js';
import { EmailLayout } from './components/EmailLayout.js';
import { BanIcon, BookIcon, ClipboardIcon, LinkIcon, RotateIcon, SparklesIcon, TrendingIcon } from './components/Icons.js';

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
                <ClipboardIcon size={48} />
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
                <table width="100%" cellPadding="0" cellSpacing="0" style={reasonItem}>
                    <tr>
                        <td width="32" style={reasonIconCell}>
                            <BanIcon size={20} />
                        </td>
                        <td>
                            <Text style={reasonTitle}>Content Policy Violation</Text>
                            <Text style={reasonDescription}>Content that violates our community guidelines, includes spam, explicit material, or misleading information.</Text>
                        </td>
                    </tr>
                </table>

                <table width="100%" cellPadding="0" cellSpacing="0" style={reasonItem}>
                    <tr>
                        <td width="32" style={reasonIconCell}>
                            <LinkIcon size={20} />
                        </td>
                        <td>
                            <Text style={reasonTitle}>Broken or Invalid Link</Text>
                            <Text style={reasonDescription}>The URL doesn't work, leads to an error page, or requires login/payment to access.</Text>
                        </td>
                    </tr>
                </table>

                <table width="100%" cellPadding="0" cellSpacing="0" style={reasonItem}>
                    <tr>
                        <td width="32" style={reasonIconCell}>
                            <TrendingIcon size={20} style={{ transform: 'scaleY(-1)' }} />
                        </td>
                        <td>
                            <Text style={reasonTitle}>Low Quality</Text>
                            <Text style={reasonDescription}>Content that's thin, poorly written, or doesn't provide significant value to users.</Text>
                        </td>
                    </tr>
                </table>

                <table width="100%" cellPadding="0" cellSpacing="0" style={reasonItem}>
                    <tr>
                        <td width="32" style={reasonIconCell}>
                            <RotateIcon size={20} />
                        </td>
                        <td>
                            <Text style={reasonTitle}>Duplicate Content</Text>
                            <Text style={reasonDescription}>The same URL or very similar content has already been submitted.</Text>
                        </td>
                    </tr>
                </table>
            </Section>

            <Section style={guidelinesBox}>
                <Text style={guidelinesTitle}>
                    <BookIcon size={18} style={{ marginRight: '8px' }} /> Review Our Guidelines
                </Text>
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
                <table width="100%" cellPadding="0" cellSpacing="0" style={actionItem}>
                    <tr>
                        <td width="36" style={actionIconCell}>
                            <table cellPadding="0" cellSpacing="0" style={actionNumber}>
                                <tr>
                                    <td style={actionNumberCell}>
                                        <Text style={actionNumberText}>1</Text>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td>
                            <Text style={actionText}>Review the rejection reason and our content guidelines</Text>
                        </td>
                    </tr>
                </table>

                <table width="100%" cellPadding="0" cellSpacing="0" style={actionItem}>
                    <tr>
                        <td width="36" style={actionIconCell}>
                            <table cellPadding="0" cellSpacing="0" style={actionNumber}>
                                <tr>
                                    <td style={actionNumberCell}>
                                        <Text style={actionNumberText}>2</Text>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td>
                            <Text style={actionText}>Fix any issues with your submission</Text>
                        </td>
                    </tr>
                </table>

                <table width="100%" cellPadding="0" cellSpacing="0" style={actionItem}>
                    <tr>
                        <td width="36" style={actionIconCell}>
                            <table cellPadding="0" cellSpacing="0" style={actionNumber}>
                                <tr>
                                    <td style={actionNumberCell}>
                                        <Text style={actionNumberText}>3</Text>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td>
                            <Text style={actionText}>Submit different content that meets our guidelines</Text>
                        </td>
                    </tr>
                </table>
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
                    <SparklesIcon size={18} style={{ marginRight: '8px' }} /> <strong>Don't give up!</strong> Every contributor gets rejections sometimes. The key
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

// Styles
const header = {
    textAlign: 'center' as const,
    margin: '24px 0',
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
    color: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
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
    backgroundColor: '#FFF5F5', // Light error tint
    border: '1px solid #FF99AA', // Lighter brand error tint
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0 24px',
};

const reasonText = {
    color: '#FF3355', // Brand error color
    fontSize: '15px',
    lineHeight: '22px',
    margin: 0,
};

const reasonsList = {
    margin: '24px 0',
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
    backgroundColor: '#F6F0E9', // Brand base-200 (cream tone)
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const guidelinesTitle = {
    color: '#0091FF', // Brand info color
    fontSize: '14px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const guidelinesText = {
    color: '#374151', // Standard text gray
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
    backgroundColor: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
};

const actionText = {
    color: '#374151',
    fontSize: '15px',
    margin: 0,
    lineHeight: '28px',
};

// Inline styles extracted to consts
const reasonItem = { marginBottom: '16px' };
const reasonIconCell = { verticalAlign: 'top' as const };
const actionItem = { marginBottom: '12px' };
const actionIconCell = { verticalAlign: 'top' as const };
const actionNumberCell = { textAlign: 'center' as const };
const actionNumberText = { color: '#fff', fontSize: '14px', fontWeight: 'bold' as const, margin: 0, lineHeight: '28px' };

const buttonContainer = {
    margin: '32px 0',
    textAlign: 'center' as const,
};

const buttonPrimary = {
    backgroundColor: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
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
    backgroundColor: '#F6F0E9', // Brand base-200 (cream tone)
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
    backgroundColor: '#FFF9E6', // Light warning yellow tint
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const encouragementText = {
    color: '#6b7280', // Standard secondary text gray
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
    color: '#FF4D6D', // Brand primary color (Punchy Pink-Red)
    textDecoration: 'underline',
};

export default SubmissionRejectedEmail;
