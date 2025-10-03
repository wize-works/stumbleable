import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { DeletionRequestEmailProps } from '../types';
import { EmailLayout } from './components/EmailLayout';

export function DeletionRequestEmail({
    scheduledDeletionDate,
    cancelUrl,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: DeletionRequestEmailProps) {
    const deletionDate = new Date(scheduledDeletionDate);
    const formattedDate = deletionDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <EmailLayout
            previewText="Your Stumbleable account deletion request has been received"
            unsubscribeUrl={unsubscribeUrl}
        >
            <Heading style={h1}>Account Deletion Request Received</Heading>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                We've received your request to delete your Stumbleable account. We're sorry to see you go!
            </Text>

            <Section style={warningBox}>
                <Text style={warningTitle}>⚠️ Important Information</Text>
                <Text style={warningText}>
                    Your account will be permanently deleted on <strong>{formattedDate}</strong>.
                </Text>
                <Text style={warningText}>
                    You have <strong>30 days</strong> to change your mind. After that, all your data will be
                    permanently removed and cannot be recovered.
                </Text>
            </Section>

            <Heading style={h2}>What Happens Next?</Heading>

            <Section style={timeline}>
                <TimelineItem
                    icon="🔒"
                    title="Now: Account Locked"
                    description="You can no longer access your account, but your data is still safe."
                />
                <TimelineItem
                    icon="📅"
                    title="30-Day Grace Period"
                    description="You'll receive reminder emails at 7 days and 1 day before deletion."
                />
                <TimelineItem
                    icon="🗑️"
                    title={`${formattedDate}: Permanent Deletion`}
                    description="All your data will be permanently removed from our systems."
                />
            </Section>

            <Heading style={h2}>Changed Your Mind?</Heading>

            <Text style={text}>
                If you'd like to keep your account, you can cancel this deletion request at any time during
                the 30-day grace period.
            </Text>

            <Section style={buttonContainer}>
                <Button style={buttonPrimary} href={cancelUrl}>
                    Keep My Account
                </Button>
            </Section>

            <Hr style={hr} />

            <Section style={infoBox}>
                <Text style={infoTitle}>📥 Before We Go</Text>
                <Text style={infoText}>
                    Don't forget to <a href={`${frontendUrl}/data-export`} style={link}>export your data</a>{' '}
                    if you haven't already. This includes all your saved discoveries and preferences.
                </Text>
            </Section>

            <Text style={footerNote}>
                Questions? <a href={`${frontendUrl}/contact`} style={link}>Contact our support team</a>.
            </Text>
        </EmailLayout>
    );
}

interface TimelineItemProps {
    icon: string;
    title: string;
    description: string;
}

function TimelineItem({ icon, title, description }: TimelineItemProps) {
    return (
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '16px' }}>
            <tr>
                <td width="40" style={{ verticalAlign: 'top' as const }}>
                    <Text style={timelineIcon}>{icon}</Text>
                </td>
                <td>
                    <Text style={timelineTitle}>{title}</Text>
                    <Text style={timelineDescription}>{description}</Text>
                </td>
            </tr>
        </table>
    );
}

// Styles
const h1 = {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: 'bold' as const,
    margin: '32px 0 24px',
    lineHeight: '1.3',
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

const warningBox = {
    backgroundColor: '#fef2f2',
    border: '2px solid #fca5a5',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const warningTitle = {
    color: '#991b1b',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    margin: '0 0 12px 0',
};

const warningText = {
    color: '#7f1d1d',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '8px 0',
};

const timeline = {
    margin: '24px 0',
};

const timelineIcon = {
    fontSize: '24px',
    margin: 0,
    lineHeight: '1',
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

const hr = {
    borderColor: '#e6ebf1',
    margin: '32px 0',
};

const infoBox = {
    backgroundColor: '#f0f9ff',
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

const footerNote = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '12px 0',
    textAlign: 'center' as const,
};

const link = {
    color: '#6366f1',
    textDecoration: 'underline',
};

export default DeletionRequestEmail;
