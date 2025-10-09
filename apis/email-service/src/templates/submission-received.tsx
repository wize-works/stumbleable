import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { SubmissionEmailProps } from '../types.js';
import { EmailLayout } from './components/EmailLayout.js';

export function SubmissionReceivedEmail({
    submissionUrl,
    submissionTitle,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: SubmissionEmailProps) {
    return (
        <EmailLayout
            previewText="Your website submission has been received"
            unsubscribeUrl={unsubscribeUrl}
        >
            <Section style={header}>
                <Text style={headerIcon}>📬</Text>
                <Heading style={h1}>Submission Received!</Heading>
            </Section>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                Thank you for submitting <strong>{submissionTitle}</strong> to Stumbleable! We've received
                your submission and it's now in our moderation queue.
            </Text>

            <Section style={submissionBox}>
                <Text style={submissionLabel}>Your Submission:</Text>
                <Text style={submissionUrlText}>{submissionUrl}</Text>
                <Text style={submissionTitleText}>{submissionTitle}</Text>
            </Section>

            <Heading style={h2}>What Happens Next?</Heading>

            <Section style={timeline}>
                {/* Timeline Item 1 - Active */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={timelineItem}>
                    <tr>
                        <td width="40" style={timelineIconCell}>
                            <table width="32" cellPadding="6" cellSpacing="0" style={badgeActive}>
                                <tr>
                                    <td style={badgeTextCell}>
                                        <Text style={badgeNumberActive}>1</Text>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td>
                            <Text style={timelineTitle}>Review Queue</Text>
                            <Text style={timelineDescription}>
                                Your submission is now in the moderation queue waiting for review.
                            </Text>
                        </td>
                    </tr>
                </table>

                {/* Timeline Item 2 */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={timelineItem}>
                    <tr>
                        <td width="40" style={timelineIconCell}>
                            <table width="32" cellPadding="6" cellSpacing="0" style={badgeInactive}>
                                <tr>
                                    <td style={badgeTextCell}>
                                        <Text style={badgeNumberInactive}>2</Text>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td>
                            <Text style={timelineTitle}>Quality Check</Text>
                            <Text style={timelineDescription}>
                                Our team reviews content for quality, relevance, and compliance with our guidelines.
                            </Text>
                        </td>
                    </tr>
                </table>

                {/* Timeline Item 3 */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={timelineItem}>
                    <tr>
                        <td width="40" style={timelineIconCell}>
                            <table width="32" cellPadding="6" cellSpacing="0" style={badgeInactive}>
                                <tr>
                                    <td style={badgeTextCell}>
                                        <Text style={badgeNumberInactive}>3</Text>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td>
                            <Text style={timelineTitle}>Decision</Text>
                            <Text style={timelineDescription}>
                                You'll receive an email within 24-48 hours letting you know if it's been approved.
                            </Text>
                        </td>
                    </tr>
                </table>
            </Section>

            <Section style={infoBox}>
                <Text style={infoTitle}>⏱️ Expected Review Time</Text>
                <Text style={infoText}>
                    Most submissions are reviewed within <strong>24-48 hours</strong>. If there's high
                    volume, it may take slightly longer. We appreciate your patience!
                </Text>
            </Section>

            <Heading style={h2}>Submission Guidelines</Heading>

            <Text style={text}>
                To help ensure approval, submissions should be:
            </Text>

            <Section style={guidelinesList}>
                {/* Guideline 1 */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={guidelineItem}>
                    <tr>
                        <td width="30" style={guidelineIconCell}>
                            <Text style={guidelineEmoji}>✓</Text>
                        </td>
                        <td>
                            <Text style={guidelineText}>High-quality, interesting content</Text>
                        </td>
                    </tr>
                </table>

                {/* Guideline 2 */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={guidelineItem}>
                    <tr>
                        <td width="30" style={guidelineIconCell}>
                            <Text style={guidelineEmoji}>✓</Text>
                        </td>
                        <td>
                            <Text style={guidelineText}>Working links (no broken pages)</Text>
                        </td>
                    </tr>
                </table>

                {/* Guideline 3 */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={guidelineItem}>
                    <tr>
                        <td width="30" style={guidelineIconCell}>
                            <Text style={guidelineEmoji}>✓</Text>
                        </td>
                        <td>
                            <Text style={guidelineText}>Appropriate for general audiences</Text>
                        </td>
                    </tr>
                </table>

                {/* Guideline 4 */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={guidelineItem}>
                    <tr>
                        <td width="30" style={guidelineIconCell}>
                            <Text style={guidelineEmoji}>✓</Text>
                        </td>
                        <td>
                            <Text style={guidelineText}>Not spam or clickbait</Text>
                        </td>
                    </tr>
                </table>
            </Section>

            <Text style={text}>
                For full details, check out our{' '}
                <a href={`${frontendUrl}/guidelines`} style={link}>
                    content guidelines
                </a>
                .
            </Text>

            <Section style={actionBox}>
                <Button style={buttonSecondary} href={`${frontendUrl}/submit`}>
                    Track Your Submissions
                </Button>
            </Section>

            <Section style={tipBox}>
                <Text style={tipTitle}>💡 Pro Tip</Text>
                <Text style={tipText}>
                    Submissions with clear descriptions and accurate categorization are approved faster!
                </Text>
            </Section>

            <Text style={thanks}>
                Thank you for contributing to the Stumbleable community! 🙌
            </Text>

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
    borderLeft: '4px solid #6366f1',
};

const submissionLabel = {
    color: '#6b7280',
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 8px 0',
    fontWeight: '600' as const,
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

const timeline = {
    margin: '24px 0',
};

const numberBadge = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    lineHeight: '32px',
};

const numberBadgeActive = {
    backgroundColor: '#6366f1',
    color: '#fff',
};

const timelineTitle = {
    color: '#1f2937',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 4px 0',
    lineHeight: '1.4',
};

const timelineDescription = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
};

const infoBox = {
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const infoTitle = {
    color: '#1e40af',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const infoText = {
    color: '#1e3a8a',
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
};

const guidelinesList = {
    margin: '16px 0',
};

const guidelineEmoji = {
    fontSize: '18px',
    margin: 0,
};

const guidelineText = {
    color: '#374151',
    fontSize: '15px',
    margin: 0,
    lineHeight: '1.5',
};

// Inline styles extracted to consts
const timelineItem = { marginBottom: '16px' };
const timelineIconCell = { verticalAlign: 'top' as const };
const badgeActive = { borderRadius: '50%', backgroundColor: '#6366f1' };
const badgeInactive = { borderRadius: '50%', backgroundColor: '#e5e7eb' };
const badgeTextCell = { textAlign: 'center' as const, verticalAlign: 'middle' as const, padding: '8px' };
const badgeNumberActive = { color: '#fff', fontSize: '14px', fontWeight: 'bold' as const, margin: 0, lineHeight: '1' };
const badgeNumberInactive = { color: '#6b7280', fontSize: '14px', fontWeight: 'bold' as const, margin: 0, lineHeight: '1' };
const guidelineItem = { marginBottom: '8px' };
const guidelineIconCell = { verticalAlign: 'middle' as const };

const actionBox = {
    margin: '32px 0',
    textAlign: 'center' as const,
};

const buttonSecondary = {
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    color: '#1f2937',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
    border: '2px solid #d1d5db',
};

const tipBox = {
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const tipTitle = {
    color: '#92400e',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const tipText = {
    color: '#78350f',
    fontSize: '13px',
    lineHeight: '20px',
    margin: 0,
};

const thanks = {
    color: '#6b7280',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '24px 0 8px',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
};

const signature = {
    color: '#9ca3af',
    fontSize: '14px',
    margin: '4px 0',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
};

const link = {
    color: '#6366f1',
    textDecoration: 'underline',
};

export default SubmissionReceivedEmail;
