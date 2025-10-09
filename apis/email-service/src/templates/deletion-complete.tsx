import { Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { DeletionCompleteEmailProps } from '../types.js';
import { EmailLayout } from './components/EmailLayout.js';

export function DeletionCompleteEmail({
    deletionDate,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: DeletionCompleteEmailProps) {
    const formattedDate = new Date(deletionDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

    return (
        <EmailLayout
            previewText="Your Stumbleable account has been permanently deleted"
            unsubscribeUrl={unsubscribeUrl}
        >
            <Section style={header}>
                <Text style={headerIcon}>✓</Text>
                <Heading style={h1}>Account Deletion Complete</Heading>
            </Section>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                Your Stumbleable account has been permanently deleted as of {formattedDate}.
            </Text>

            <Section style={confirmBox}>
                <Text style={confirmTitle}>What Was Deleted:</Text>
                <table width="100%" cellPadding="0" cellSpacing="0" style={confirmItem}>
                    <tr>
                        <td width="24" style={confirmIconCell}>
                            <Text style={checkmark}>✓</Text>
                        </td>
                        <td>
                            <Text style={confirmItemText}>Your profile and account information</Text>
                        </td>
                    </tr>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={confirmItem}>
                    <tr>
                        <td width="24" style={confirmIconCell}>
                            <Text style={checkmark}>✓</Text>
                        </td>
                        <td>
                            <Text style={confirmItemText}>All saved discoveries and collections</Text>
                        </td>
                    </tr>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={confirmItem}>
                    <tr>
                        <td width="24" style={confirmIconCell}>
                            <Text style={checkmark}>✓</Text>
                        </td>
                        <td>
                            <Text style={confirmItemText}>Your likes, preferences, and interaction history</Text>
                        </td>
                    </tr>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" style={confirmItem}>
                    <tr>
                        <td width="24" style={confirmIconCell}>
                            <Text style={checkmark}>✓</Text>
                        </td>
                        <td>
                            <Text style={confirmItemText}>Settings and customizations</Text>
                        </td>
                    </tr>
                </table>
            </Section>

            <Heading style={h2}>Your Data Privacy</Heading>

            <Text style={text}>
                We take your privacy seriously. All personal data has been permanently removed from our
                systems in accordance with our{' '}
                <a href={`${frontendUrl}/privacy`} style={link}>
                    Privacy Policy
                </a>{' '}
                and data protection regulations (GDPR, CCPA).
            </Text>

            <Section style={retentionBox}>
                <Text style={retentionTitle}>📋 What We Keep (by law)</Text>
                <Text style={retentionText}>
                    For legal and compliance purposes, we retain anonymized transaction logs and account
                    activity summaries for 90 days. These cannot be linked back to you personally.
                </Text>
            </Section>

            <Hr style={hr} />

            <Heading style={h2}>We're Sorry to See You Go</Heading>

            <Text style={text}>
                Thank you for being part of the Stumbleable community. We're constantly working to improve,
                and your feedback matters.
            </Text>

            <Section style={feedbackBox}>
                <Text style={feedbackTitle}>💬 Got a minute?</Text>
                <Text style={feedbackText}>
                    We'd love to know why you left.{' '}
                    <a href={`${frontendUrl}/feedback?reason=account_deletion`} style={link}>
                        Share your feedback
                    </a>{' '}
                    to help us improve for others.
                </Text>
            </Section>

            <Heading style={h2}>Want to Return?</Heading>

            <Text style={text}>
                You're always welcome back! If you decide to return, you'll need to create a new account.
                Unfortunately, we cannot recover your previous data.
            </Text>

            <Section style={rejoinBox}>
                <Text style={rejoinText}>
                    🌟 <a href={`${frontendUrl}/sign-up`} style={linkBold}>Create a new account</a> and
                    start discovering amazing content again.
                </Text>
            </Section>

            <Text style={farewell}>
                Safe travels on the web, and we hope our paths cross again someday.
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
    color: '#10b981',
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

const confirmBox = {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const confirmTitle = {
    color: '#1f2937',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 12px 0',
};

const checkmark = {
    color: '#10b981',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    margin: 0,
};

const confirmItemText = {
    color: '#4b5563',
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.5',
};

const confirmItem = { marginBottom: '8px' };
const confirmIconCell = { verticalAlign: 'top' as const };

const retentionBox = {
    backgroundColor: '#fffbeb',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const retentionTitle = {
    color: '#92400e',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const retentionText = {
    color: '#78350f',
    fontSize: '13px',
    lineHeight: '20px',
    margin: 0,
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '32px 0',
};

const feedbackBox = {
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const feedbackTitle = {
    color: '#1e40af',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const feedbackText = {
    color: '#1e3a8a',
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
};

const rejoinBox = {
    backgroundColor: '#faf5ff',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
    textAlign: 'center' as const,
};

const rejoinText = {
    color: '#6b21a8',
    fontSize: '15px',
    lineHeight: '22px',
    margin: 0,
};

const farewell = {
    color: '#6b7280',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '24px 0 8px',
    fontStyle: 'italic' as const,
};

const signature = {
    color: '#9ca3af',
    fontSize: '14px',
    margin: '4px 0',
    fontStyle: 'italic' as const,
};

const link = {
    color: '#6366f1',
    textDecoration: 'underline',
};

const linkBold = {
    color: '#6366f1',
    textDecoration: 'underline',
    fontWeight: 'bold' as const,
};

export default DeletionCompleteEmail;
