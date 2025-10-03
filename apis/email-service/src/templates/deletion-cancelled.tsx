import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { DeletionCancelledEmailProps } from '../types';
import { EmailLayout } from './components/EmailLayout';

export function DeletionCancelledEmail({
    cancelledDate,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: DeletionCancelledEmailProps) {
    const formattedDate = new Date(cancelledDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

    return (
        <EmailLayout
            previewText="Welcome back! Your account deletion has been cancelled"
            unsubscribeUrl={unsubscribeUrl}
        >
            <Section style={celebrationBanner}>
                <Text style={celebrationIcon}>🎉</Text>
                <Heading style={h1}>Welcome Back!</Heading>
                <Text style={bannerText}>Your account has been restored</Text>
            </Section>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                Great news! Your account deletion request has been successfully cancelled as of{' '}
                {formattedDate}. We're thrilled to have you back with Stumbleable!
            </Text>

            <Section style={statusBox}>
                <Text style={statusTitle}>✅ Your Account Status</Text>
                <Section style={statusList}>
                    <StatusItem label="Account" status="Active" />
                    <StatusItem label="Saved Discoveries" status="Fully Restored" />
                    <StatusItem label="Preferences" status="Intact" />
                    <StatusItem label="Interaction History" status="Preserved" />
                </Section>
            </Section>

            <Heading style={h2}>Ready to Stumble Again?</Heading>

            <Text style={text}>
                Everything is exactly as you left it. Your preferences, saved discoveries, and interaction
                history are all waiting for you.
            </Text>

            <Section style={buttonContainer}>
                <Button style={buttonPrimary} href={`${frontendUrl}/stumble`}>
                    Start Stumbling
                </Button>
            </Section>

            <Section style={quickLinksBox}>
                <Text style={quickLinksTitle}>Quick Links to Get Back In:</Text>
                <Section style={quickLinksList}>
                    <QuickLink
                        emoji="🔖"
                        text="View your saved discoveries"
                        url={`${frontendUrl}/saved`}
                    />
                    <QuickLink
                        emoji="🎯"
                        text="Update your interests"
                        url={`${frontendUrl}/dashboard`}
                    />
                    <QuickLink
                        emoji="🔥"
                        text="Check out trending content"
                        url={`${frontendUrl}/explore?sort=trending`}
                    />
                </Section>
            </Section>

            <Heading style={h2}>We're Here to Help</Heading>

            <Text style={text}>
                If you had any concerns that led to the deletion request, we'd love to hear about them and
                see how we can improve your experience.
            </Text>

            <Section style={supportBox}>
                <Text style={supportText}>
                    💬 <a href={`${frontendUrl}/contact`} style={link}>Share your feedback</a> or{' '}
                    <a href={`${frontendUrl}/help`} style={link}>browse our help center</a> if you need
                    assistance.
                </Text>
            </Section>

            <Section style={tipBox}>
                <Text style={tipTitle}>💡 Did You Know?</Text>
                <Text style={tipText}>
                    You can always take a break without deleting your account. Just sign out and come back
                    whenever you're ready. Your discoveries will be waiting!
                </Text>
            </Section>

            <Text style={welcomeBack}>
                We're glad you decided to stay. Happy stumbling! 🚀
            </Text>

            <Text style={signature}>
                — The Stumbleable Team
            </Text>
        </EmailLayout>
    );
}

interface StatusItemProps {
    label: string;
    status: string;
}

function StatusItem({ label, status }: StatusItemProps) {
    return (
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '8px' }}>
            <tr>
                <td width="140">
                    <Text style={statusLabel}>{label}:</Text>
                </td>
                <td>
                    <Text style={statusValue}>{status}</Text>
                </td>
            </tr>
        </table>
    );
}

interface QuickLinkProps {
    emoji: string;
    text: string;
    url: string;
}

function QuickLink({ emoji, text, url }: QuickLinkProps) {
    return (
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '10px' }}>
            <tr>
                <td width="30" style={{ verticalAlign: 'middle' as const }}>
                    <Text style={quickLinkIcon}>{emoji}</Text>
                </td>
                <td>
                    <a href={url} style={quickLinkText}>
                        {text}
                    </a>
                </td>
            </tr>
        </table>
    );
}

// Styles
const celebrationBanner = {
    backgroundColor: '#f0fdf4',
    borderRadius: '12px',
    padding: '32px 24px',
    textAlign: 'center' as const,
    margin: '24px 0',
    border: '2px solid #86efac',
};

const celebrationIcon = {
    fontSize: '48px',
    margin: '0 0 16px 0',
    lineHeight: '1',
};

const h1 = {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px',
};

const bannerText = {
    color: '#059669',
    fontSize: '16px',
    fontWeight: '600' as const,
    margin: 0,
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

const statusBox = {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const statusTitle = {
    color: '#1f2937',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 16px 0',
};

const statusList = {
    margin: 0,
};

const statusLabel = {
    color: '#6b7280',
    fontSize: '14px',
    margin: 0,
};

const statusValue = {
    color: '#059669',
    fontSize: '14px',
    fontWeight: '600' as const,
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

const quickLinksBox = {
    backgroundColor: '#faf5ff',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const quickLinksTitle = {
    color: '#6b21a8',
    fontSize: '15px',
    fontWeight: 'bold' as const,
    margin: '0 0 12px 0',
};

const quickLinksList = {
    margin: 0,
};

const quickLinkIcon = {
    fontSize: '18px',
    margin: 0,
};

const quickLinkText = {
    color: '#6366f1',
    fontSize: '14px',
    textDecoration: 'underline',
    lineHeight: '1.5',
};

const supportBox = {
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const supportText = {
    color: '#1e3a8a',
    fontSize: '14px',
    lineHeight: '20px',
    margin: 0,
};

const tipBox = {
    backgroundColor: '#fffbeb',
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

const welcomeBack = {
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

export default DeletionCancelledEmail;
