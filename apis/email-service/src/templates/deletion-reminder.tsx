import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { DeletionReminderEmailProps } from '../types';
import { EmailLayout } from './components/EmailLayout';

export function DeletionReminderEmail({
    daysRemaining,
    scheduledDeletionDate,
    cancelUrl,
    firstName = 'there',
    email,
    frontendUrl,
    unsubscribeUrl,
}: DeletionReminderEmailProps) {
    const deletionDate = new Date(scheduledDeletionDate);
    const formattedDate = deletionDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const isUrgent = daysRemaining === 1;
    const emoji = isUrgent ? '⚠️' : '⏰';
    const urgencyLevel = isUrgent ? 'Tomorrow' : `${daysRemaining} Days`;

    return (
        <EmailLayout
            previewText={`${emoji} Your account will be deleted in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`}
            unsubscribeUrl={unsubscribeUrl}
        >
            <Section style={isUrgent ? urgentBanner : reminderBanner}>
                <Text style={bannerIcon}>{emoji}</Text>
                <Heading style={bannerTitle}>
                    {isUrgent ? 'Final Reminder' : 'Deletion Reminder'}
                </Heading>
                <Text style={bannerText}>
                    Your account will be deleted in <strong>{urgencyLevel}</strong>
                </Text>
            </Section>

            <Text style={text}>Hi {firstName},</Text>

            <Text style={text}>
                This is a {isUrgent ? 'final' : 'friendly'} reminder that your Stumbleable account is
                scheduled for deletion on <strong>{formattedDate}</strong>.
            </Text>

            <Section style={countdownBox}>
                <Text style={countdownNumber}>{daysRemaining}</Text>
                <Text style={countdownLabel}>{daysRemaining === 1 ? 'Day' : 'Days'} Remaining</Text>
            </Section>

            <Heading style={h2}>What Will Be Deleted?</Heading>

            <Section style={deleteList}>
                <DeleteItem icon="👤" text="Your profile and account information" />
                <DeleteItem icon="💾" text="All saved discoveries and collections" />
                <DeleteItem icon="❤️" text="Your likes, preferences, and interaction history" />
                <DeleteItem icon="⚙️" text="Settings and customizations" />
            </Section>

            <Text style={text}>
                <strong>This action cannot be undone.</strong> Once your account is deleted, we cannot
                recover your data.
            </Text>

            <Heading style={h2}>Changed Your Mind?</Heading>

            <Text style={text}>
                If you'd like to keep discovering great content with Stumbleable, you can cancel the
                deletion at any time before {formattedDate}.
            </Text>

            <Section style={buttonContainer}>
                <Button style={buttonPrimary} href={cancelUrl}>
                    Keep My Account
                </Button>
            </Section>

            <Section style={infoBox}>
                <Text style={infoText}>
                    💡 <strong>Last chance to save your data:</strong>{' '}
                    <a href={`${frontendUrl}/data-export`} style={link}>
                        Download your data
                    </a>{' '}
                    before it's gone forever.
                </Text>
            </Section>

            <Text style={footerNote}>
                Questions? <a href={`${frontendUrl}/contact`} style={link}>Contact support</a> – we're here
                to help.
            </Text>
        </EmailLayout>
    );
}

interface DeleteItemProps {
    icon: string;
    text: string;
}

function DeleteItem({ icon, text }: DeleteItemProps) {
    return (
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '8px' }}>
            <tr>
                <td width="30" style={{ verticalAlign: 'top' as const }}>
                    <Text style={deleteIcon}>{icon}</Text>
                </td>
                <td>
                    <Text style={deleteText}>{text}</Text>
                </td>
            </tr>
        </table>
    );
}

// Styles
const reminderBanner = {
    backgroundColor: '#fef3c7',
    borderRadius: '12px',
    padding: '32px 24px',
    textAlign: 'center' as const,
    margin: '24px 0',
};

const urgentBanner = {
    backgroundColor: '#fee2e2',
    borderRadius: '12px',
    padding: '32px 24px',
    textAlign: 'center' as const,
    margin: '24px 0',
};

const bannerIcon = {
    fontSize: '48px',
    margin: '0 0 16px 0',
    lineHeight: '1',
};

const bannerTitle = {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
};

const bannerText = {
    color: '#374151',
    fontSize: '16px',
    margin: 0,
};

const text = {
    color: '#374151',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '16px 0',
};

const h2 = {
    color: '#1f2937',
    fontSize: '20px',
    fontWeight: 'bold' as const,
    margin: '32px 0 16px',
};

const countdownBox = {
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center' as const,
    margin: '24px 0',
};

const countdownNumber = {
    color: '#dc2626',
    fontSize: '64px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
    lineHeight: '1',
};

const countdownLabel = {
    color: '#6b7280',
    fontSize: '18px',
    fontWeight: '600' as const,
    margin: 0,
};

const deleteList = {
    margin: '16px 0',
};

const deleteIcon = {
    fontSize: '18px',
    margin: 0,
};

const deleteText = {
    color: '#374151',
    fontSize: '15px',
    margin: 0,
    lineHeight: '1.5',
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

const infoBox = {
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
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

export default DeletionReminderEmail;
